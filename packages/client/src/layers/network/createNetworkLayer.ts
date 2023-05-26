import {
  ComponentValue,
  createEntity,
  createIndexer,
  createLocalCache,
  createWorld,
  EntityID,
  EntityIndex,
  getComponentValue,
  getEntitiesWithValue,
  HasValue,
  removeComponent,
  runQuery,
  SchemaOf,
  setComponent,
  updateComponent,
  withValue,
} from "@latticexyz/recs";
import { setupDevSystems } from "./setup";
import { createActionSystem, setupMUDNetwork, waitForActionCompletion } from "@latticexyz/std-client";
import { GameConfig, getNetworkConfig } from "./config";
import { awaitPromise, computedToStream, Coord, filterNullishValues, VoxelCoord } from "@latticexyz/utils";
import { BigNumber, utils, Signer } from "ethers";
import {
  definePositionComponent,
  defineOwnedByComponent,
  defineGameConfigComponent,
  defineRecipeComponent,
  defineLoadingStateComponent,
  defineItemComponent,
  defineItemPrototypeComponent,
  defineOccurrenceComponent,
  defineStakeComponent,
  defineClaimComponent,
  defineNameComponent,
  definePluginComponent,
  definePluginRegistryComponent,
  defineVoxelRulesComponent,
  defineEntityIdComponent,
} from "./components";
import {
  getBlockAtPosition as getBlockAtPositionApi,
  getEntityAtPosition as getEntityAtPositionApi,
  getECSBlock,
  getTerrain,
  getTerrainBlock,
  getBiome,
} from "./api";
import { createPerlin } from "@latticexyz/noise";
import { BlockIdToKey, BlockType } from "./constants";
import { createFaucetService, createRelayStream, GodID } from "@latticexyz/network";
import { SystemTypes } from "contracts/types/SystemTypes";
import { SystemAbis } from "contracts/types/SystemAbis.mjs";
import { map, timer, combineLatest, BehaviorSubject } from "rxjs";
import { createPluginSystem } from "./systems";
import { TransitionRuleStruct } from "contracts/types/ethers-contracts/RegisterVoxelTypeSystem";
import { VoxelCoordStruct } from "contracts/types/ethers-contracts/RegisterCreationSystem";
import { defineSignalComponent } from "./components/SignalComponent";
import { defineInvertedSignalComponent } from "./components/InvertedSignalComponent";
import { defineSignalSourceComponent } from "./components/SignalSourceComponent";
import { definePassesTestsComponent } from "./components/PassesTestsComponent";

/**
 * The Network layer is the lowest layer in the client architecture.
 * Its purpose is to synchronize the client components with the contract components.
 */
export async function createNetworkLayer(config: GameConfig) {
  console.info("[Network] Network config");
  console.table(config);

  // --- WORLD ----------------------------------------------------------------------
  const world = createWorld();
  const uniqueWorldId = config.chainId + config.worldAddress;

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    Position: definePositionComponent(world),
    ItemPrototype: defineItemPrototypeComponent(world),
    Item: defineItemComponent(world),
    Name: defineNameComponent(world),
    OwnedBy: defineOwnedByComponent(world),
    GameConfig: defineGameConfigComponent(world),
    Recipe: defineRecipeComponent(world),
    LoadingState: defineLoadingStateComponent(world),
    Occurrence: defineOccurrenceComponent(world),
    Stake: defineStakeComponent(world),
    Claim: defineClaimComponent(world),
    Plugin: createLocalCache(definePluginComponent(world), uniqueWorldId),
    PluginRegistry: createLocalCache(definePluginRegistryComponent(world), uniqueWorldId),
    VoxelRules: createLocalCache(defineVoxelRulesComponent(world), uniqueWorldId),
    Signal: defineSignalComponent(world),
    InvertedSignal: defineInvertedSignalComponent(world),
    SignalSource: defineSignalSourceComponent(world),
    EntityId: defineEntityIdComponent(world),
    PassesTests: definePassesTestsComponent(world),
  };

  // --- SETUP ----------------------------------------------------------------------
  const {
    txQueue,
    systems,
    txReduced$,
    network,
    startSync,
    encoders,
    ecsEvent$,
    mappings,
    registerComponent,
    registerSystem,
  } = await setupMUDNetwork<typeof components, SystemTypes>(getNetworkConfig(config), world, components, SystemAbis, {
    initialGasPrice: 2_000_000,
  });

  // Relayer setup
  const playerAddress = network.connectedAddress.get();
  const playerSigner = network.signer.get();
  let relay: Awaited<ReturnType<typeof createRelayStream>> | undefined;
  try {
    relay =
      config.relayServiceUrl && playerAddress && playerSigner
        ? await createRelayStream(playerSigner, config.relayServiceUrl, playerAddress)
        : undefined;
  } catch (e) {
    console.error(e);
  }

  relay && world.registerDisposer(relay.dispose);
  if (relay) console.info("[Relayer] Relayer connected: " + config.relayServiceUrl);

  // Faucet setup
  const faucet = config.faucetServiceUrl ? createFaucetService(config.faucetServiceUrl) : undefined;

  const playerIsBroke = (await network.signer.get()?.getBalance())?.lte(utils.parseEther("0.005"));
  if (playerIsBroke) {
    console.info("[Dev Faucet] Dripping funds to player");
    const address = network.connectedAddress.get();
    address && (await faucet?.dripDev({ address }));
  }

  // Set initial component values
  if (components.PluginRegistry.entities.length === 0) {
    addPluginRegistry("https://opcraft-plugins.mud.dev");
  }

  // Enable chat plugin by default
  if (
    getEntitiesWithValue(components.Plugin, { host: "https://opcraft-plugins.mud.dev", path: "/chat.js" }).size === 0
  ) {
    console.info("Enabling chat plugin by default");
    addPlugin({
      host: "https://opcraft-plugins.mud.dev",
      path: "/chat.js",
      active: true,
      source: "https://github.com/latticexyz/opcraft-plugins",
    });
  }

  // --- ACTION SYSTEM --------------------------------------------------------------
  const actions = createActionSystem<{
    actionType: string;
    coord?: VoxelCoord;
    blockType?: keyof typeof BlockType;
  }>(world, txReduced$);

  // Add indexers and optimistic updates
  const { withOptimisticUpdates } = actions;
  components.Position = createIndexer(withOptimisticUpdates(components.Position));
  components.OwnedBy = createIndexer(withOptimisticUpdates(components.OwnedBy));
  components.Item = withOptimisticUpdates(components.Item);

  // --- API ------------------------------------------------------------------------

  const perlin = await createPerlin();
  const terrainContext = {
    Position: components.Position,
    Item: components.Item,
    world,
  };

  function getTerrainBlockAtPosition(position: VoxelCoord) {
    return getTerrainBlock(getTerrain(position, perlin), position, perlin);
  }

  function getECSBlockAtPosition(position: VoxelCoord) {
    return getECSBlock(terrainContext, position);
  }
  function getBlockAtPosition(position: VoxelCoord) {
    return getBlockAtPositionApi(terrainContext, perlin, position);
  }
  function getEntityAtPosition(position: VoxelCoord) {
    return getEntityAtPositionApi(terrainContext, position);
  }

  function getSignalData(entityIndex: EntityIndex) {
    return getComponentValue(components.Signal, entityIndex);
  }

  function getInvertedSignalData(entityIndex: EntityIndex) {
    return getComponentValue(components.InvertedSignal, entityIndex);
  }

  function isSignalSource(entityIndex: EntityIndex) {
    const signalSource = getComponentValue(components.SignalSource, entityIndex)?.value;
    return signalSource;
  }

  function build(entity: EntityID, coord: VoxelCoord) {
    const entityIndex = world.entityToIndex.get(entity);
    if (entityIndex == null) return console.warn("trying to place unknown entity", entity);
    const blockId = getComponentValue(components.Item, entityIndex)?.value;
    const blockType = blockId != null ? BlockIdToKey[blockId as EntityID] : undefined;
    const godIndex = world.entityToIndex.get(GodID);
    // const creativeMode = godIndex != null && getComponentValue(components.GameConfig, godIndex)?.creativeMode;
    // lol this is so sus

    // Note: needs to be off for block interactions
    const creativeMode = false;

    actions.add({
      id: `build+${coord.x}/${coord.y}/${coord.z}` as EntityID,
      metadata: { actionType: "build", coord, blockType },
      requirement: () => true,
      components: { Position: components.Position, Item: components.Item, OwnedBy: components.OwnedBy },
      execute: () =>
        systems[creativeMode ? "system.CreativeBuild" : "system.Build"].executeTyped(BigNumber.from(entity), coord, {
          gasLimit: 100_000_000,
        }),
      updates: () => [
        // {
        //   component: "OwnedBy",
        //   entity: entityIndex,
        //   value: { value: GodID },
        // },
        // {
        //   component: "Position",
        //   entity: entityIndex,
        //   value: coord,
        // },
      ],
    });
  }

  async function mine(coord: VoxelCoord) {
    const ecsBlock = getECSBlockAtPosition(coord);
    const blockId = ecsBlock ?? getTerrainBlockAtPosition(coord);

    if (blockId == null) throw new Error("entity has no block type");
    const blockType = BlockIdToKey[blockId];
    const blockEntity = getEntityAtPosition(coord);
    const airEntity = world.registerEntity();

    actions.add({
      id: `mine+${coord.x}/${coord.y}/${coord.z}` as EntityID,
      metadata: { actionType: "mine", coord, blockType },
      requirement: () => true,
      components: { Position: components.Position, OwnedBy: components.OwnedBy, Item: components.Item },
      execute: () =>
        systems["system.Mine"].executeTyped(coord, blockId, { gasLimit: ecsBlock ? 100_000_000 : 100_000_000 }),
      updates: () => [
        {
          component: "Position",
          entity: airEntity,
          value: coord,
        },
        {
          component: "Item",
          entity: airEntity,
          value: { value: BlockType.Air },
        },
        {
          component: "Position",
          entity: blockEntity || (Number.MAX_SAFE_INTEGER as EntityIndex),
          value: null,
        },
      ],
    });
  }

  async function craft(ingredients: EntityID[][], result: EntityID) {
    const entities = filterNullishValues(ingredients.flat().map((id) => world.entityToIndex.get(id)));

    const id = actions.add({
      id: `craft ${entities.join("/")}` as EntityID,
      metadata: { actionType: "craft", blockType: BlockIdToKey[result] },
      requirement: () => true,
      components: { OwnedBy: components.OwnedBy },
      execute: () => systems["system.Craft"].executeTyped(ingredients, { gasLimit: 600_000 }),
      updates: () =>
        entities.map((entity) => ({
          component: "OwnedBy",
          entity,
          value: { value: GodID },
        })),
    });

    await waitForActionCompletion(actions.Action, id);
  }

  function stake(chunkCoord: Coord) {
    const diamondEntityIndex = [
      ...runQuery([
        HasValue(components.OwnedBy, { value: network.connectedAddress.get() }),
        HasValue(components.Item, { value: BlockType.Diamond }),
      ]),
    ][0];

    if (diamondEntityIndex == null) return console.warn("No owned diamonds to stake");
    const diamondEntity = world.entities[diamondEntityIndex];

    actions.add({
      id: `stake+${chunkCoord.x}/${chunkCoord.y}` as EntityID,
      metadata: { actionType: "stake", blockType: "Diamond" },
      requirement: () => true,
      components: { OwnedBy: components.OwnedBy },
      execute: () => systems["system.Stake"].executeTyped(diamondEntity, chunkCoord, { gasLimit: 400_000 }),
      updates: () => [
        {
          component: "OwnedBy",
          entity: diamondEntityIndex,
          value: { value: GodID },
        },
      ],
    });
  }

  function claim(chunkCoord: Coord) {
    actions.add({
      id: `claim+${chunkCoord.x}/${chunkCoord.y}` as EntityID,
      metadata: { actionType: "claim", blockType: "Diamond" },
      requirement: () => true,
      components: {},
      execute: () => systems["system.Claim"].executeTyped(chunkCoord, { gasLimit: 400_000 }),
      updates: () => [],
    });
  }

  function registerVoxelType(voxelTypeName: string, rules: TransitionRuleStruct[], hexColor: string) {
    actions.add({
      id: `registerVoxelType+${voxelTypeName}` as EntityID,
      metadata: { actionType: "registerVoxelType" },
      requirement: () => true,
      components: {},
      execute: () =>
        systems["system.RegisterVoxelType"].executeTyped(voxelTypeName, rules, hexColor, { gasLimit: 100_000_000 }),
      updates: () => [],
    });
  }

  function giftVoxel(voxelTypeId: number) {
    actions.add({
      // id: `registerVoxelType+${voxelTypeName}-${rules.toString()}-${hexColor}` as EntityID,
      id: `GiftVoxel` as EntityID,
      metadata: { actionType: "GiftVoxel" },
      requirement: () => true,
      components: {},
      execute: () => systems["system.GiftVoxel"].executeTyped(voxelTypeId, { gasLimit: 100_000_000 }),
      updates: () => [],
    });
  }

  function registerCreation(creationName: string, vertex1: VoxelCoordStruct, vertex2: VoxelCoordStruct) {
    actions.add({
      id: `registerCreation+${creationName}` as EntityID,
      metadata: { actionType: "registerCreation" },
      requirement: () => true,
      components: {},
      execute: () =>
        systems["system.RegisterCreation"].executeTyped(creationName, vertex1, vertex2, { gasLimit: 100_000_000 }),
      updates: () => [],
    });
  }

  function submitAdderTest(creationId: number, points: number[]) {
    actions.add({
      id: `submitAdderTest+${creationId}` as EntityID,
      metadata: { actionType: "adderTest" },
      requirement: () => true,
      components: {},
      execute: () =>
        systems["system.AdderTest"].executeTyped(creationId, [points[0]], [points[1]], [points[2]], [points[3]], {
          gasLimit: 100_000_000,
        }),
      updates: () => [],
    });
  }

  function submitHalfAdderTest(creationId: string, points: VoxelCoord[]) {
    actions.add({
      id: `submitHalfAdderTest+${creationId}` as EntityID,
      metadata: { actionType: "halfAdderTest" },
      requirement: () => true,
      components: {},
      execute: () =>
        systems["system.HalfAdderTest"].executeTyped(creationId, points[0], points[1], points[2], points[3], {
          gasLimit: 100_000_000,
        }),
      updates: () => [],
    });
  }

  function spawnCreation(creationId: string, lowerSouthWestCorner: VoxelCoordStruct) {
    actions.add({
      id: `spawnCreation+${creationId}` as EntityID,
      metadata: { actionType: "spawnCreation" },
      requirement: () => true,
      components: {},
      execute: () =>
        systems["system.SpawnCreation"].executeTyped(creationId, lowerSouthWestCorner, { gasLimit: 100_000_000 }),
      updates: () => [],
    });
  }

  function submitAndTest(creationId: string, points: VoxelCoord[]) {
    actions.add({
      id: `submitAndTest+${creationId}` as EntityID,
      metadata: { actionType: "andTest" },
      requirement: () => true,
      components: {},
      execute: () =>
        systems["system.AndTest"].executeTyped(creationId, points[0], points[1], points[2], {
          gasLimit: 100_000_000,
        }),
      updates: () => [],
    });
  }

  function submitNandTest(creationId: string, points: VoxelCoord[]) {
    actions.add({
      id: `submitAndTest+${creationId}` as EntityID,
      metadata: { actionType: "nandTest" },
      requirement: () => true,
      components: {},
      execute: () =>
        systems["system.NandTest"].executeTyped(creationId, points[0], points[1], points[2], {
          gasLimit: 100_000_000,
        }),
      updates: () => [],
    });
  }
  function transfer(entity: EntityID, receiver: string) {
    const entityIndex = world.entityToIndex.get(entity);
    if (entityIndex == null) return console.warn("trying to transfer unknown entity", entity);
    const blockId = getComponentValue(components.Item, entityIndex)?.value;
    const blockType = blockId != null ? BlockIdToKey[blockId as EntityID] : undefined;

    actions.add({
      id: `transfer+${entity}` as EntityID,
      metadata: { actionType: "transfer", blockType },
      requirement: () => true,
      components: { OwnedBy: components.OwnedBy },
      execute: () => systems["system.Transfer"].executeTyped(entity, receiver, { gasLimit: 400_000 }),
      updates: () => [
        {
          component: "OwnedBy",
          entity: entityIndex,
          value: { value: GodID },
        },
      ],
    });
  }

  function togglePlugin(entity: EntityIndex, active?: boolean) {
    updateComponent(components.Plugin, entity, { active });
  }

  function reloadPlugin(entity: EntityIndex) {
    const active = getComponentValue(components.Plugin, entity)?.active;
    if (!active) return;
    togglePlugin(entity, false);
    togglePlugin(entity, true);
  }

  function addPlugin(value: ComponentValue<SchemaOf<typeof components.Plugin>>) {
    const { host, path, source, active } = value;
    const exists = getEntitiesWithValue(components.Plugin, { host, path }).size > 0;
    if (!exists) createEntity(world, [withValue(components.Plugin, { host, path, source, active })]);
  }

  function addPluginRegistry(url: string) {
    url = url[url.length - 1] === "/" ? url.substring(0, url.length - 1) : url;
    if (getEntitiesWithValue(components.PluginRegistry, { value: url }).size > 0) return;
    createEntity(world, [withValue(components.PluginRegistry, { value: url })]);
  }

  function removePluginRegistry(url: string) {
    const entity = [...getEntitiesWithValue(components.PluginRegistry, { value: url })][0];
    if (entity == null) return;
    removeComponent(components.PluginRegistry, entity);
  }

  function reloadPluginRegistryUrl(url: string) {
    const entity = [...getEntitiesWithValue(components.PluginRegistry, { value: url })][0];
    if (entity == null) return;
    removeComponent(components.PluginRegistry, entity);
    setComponent(components.PluginRegistry, entity, { value: url });
  }

  function reloadPluginRegistry(entity: EntityIndex) {
    const value = getComponentValue(components.PluginRegistry, entity);
    if (!value) return;
    removeComponent(components.PluginRegistry, entity);
    setComponent(components.PluginRegistry, entity, value);
  }

  function getName(address: EntityID): string | undefined {
    const entityIndex = world.entityToIndex.get(address);
    return entityIndex != null ? getComponentValue(components.Name, entityIndex)?.value : undefined;
  }

  // --- STREAMS --------------------------------------------------------------------
  const balanceGwei$ = new BehaviorSubject<number>(1);
  world.registerDisposer(
    combineLatest([timer(0, 5000), computedToStream(network.signer)])
      .pipe(
        map<[number, Signer | undefined], Promise<number>>(async ([, signer]) =>
          signer
            ? signer.getBalance().then((v) => v.div(BigNumber.from(10).pow(9)).toNumber())
            : new Promise((res) => res(0))
        ),
        awaitPromise()
      )
      .subscribe(balanceGwei$)?.unsubscribe
  );

  const connectedClients$ = timer(0, 5000).pipe(
    map(async () => relay?.countConnected() || 0),
    awaitPromise()
  );

  // --- CONTEXT --------------------------------------------------------------------
  const context = {
    world,
    components,
    txQueue,
    systems,
    txReduced$,
    startSync,
    network,
    actions,
    api: {
      build,
      mine,
      craft,
      stake,
      claim,
      registerVoxelType,
      giftVoxel,
      registerCreation,
      submitAdderTest,
      submitHalfAdderTest,
      spawnCreation,
      submitAndTest,
      submitNandTest,
      transfer,
      getBlockAtPosition,
      getECSBlockAtPosition,
      getTerrainBlockAtPosition,
      getSignalData,
      getInvertedSignalData,
      isSignalSource,
      getEntityAtPosition,
      getBiome,
      getName,
      addPlugin,
      reloadPlugin,
      togglePlugin,
      addPluginRegistry,
      removePluginRegistry,
      reloadPluginRegistry,
      reloadPluginRegistryUrl,
      registerComponent,
      registerSystem,
    },
    dev: setupDevSystems(world, encoders as Promise<any>, systems),
    streams: { connectedClients$, balanceGwei$ },
    config,
    relay,
    worldAddress: config.worldAddress,
    ecsEvent$,
    mappings,
    faucet,
    uniqueWorldId,
    types: { BlockIdToKey, BlockType },
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createPluginSystem(context);

  return context;
}
