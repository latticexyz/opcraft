import {
  createIndexer,
  createWorld,
  EntityID,
  EntityIndex,
  getComponentValue,
  HasValue,
  runQuery,
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
  defineSystemsRegistryComponent,
  defineComponentsRegistryComponent,
} from "./components";
import {
  getBlockAtPosition as getBlockAtPositionApi,
  getEntityAtPosition as getEntityAtPositionApi,
  getECSBlock,
  getTerrain,
  getTerrainBlock,
} from "./api";
import { createPerlin } from "@latticexyz/noise";
import { BlockIdToKey, BlockType } from "./constants";
import { createFaucetService, createRelayStream, GodID } from "@latticexyz/network";
import { SystemTypes } from "contracts/types/SystemTypes";
import { SystemAbis } from "contracts/types/SystemAbis.mjs";
import { map, timer, combineLatest, BehaviorSubject } from "rxjs";

/**
 * The Network layer is the lowest layer in the client architecture.
 * Its purpose is to synchronize the client components with the contract components.
 */
export async function createNetworkLayer(config: GameConfig) {
  console.info("[Network] Network config");
  console.table(config);

  // --- WORLD ----------------------------------------------------------------------
  const world = createWorld();

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
    // The following two components are replaced after calling setupMUDNetwork
    SystemsRegistry: defineSystemsRegistryComponent(world),
    ComponentsRegistry: defineComponentsRegistryComponent(world),
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
    SystemsRegistry,
    ComponentsRegistry,
  } = await setupMUDNetwork<typeof components, SystemTypes>(getNetworkConfig(config), world, components, SystemAbis, {
    initialGasPrice: 2_000_000,
  });

  // Add registries to exported components objects
  components.SystemsRegistry = SystemsRegistry;
  components.ComponentsRegistry = ComponentsRegistry;

  // Relayer setup
  const playerAddress = network.connectedAddress.get();
  const playerSigner = network.signer.get();
  const relay =
    config.relayServiceUrl && playerAddress && playerSigner
      ? await createRelayStream(playerSigner, config.relayServiceUrl, playerAddress)
      : null;

  relay && world.registerDisposer(relay.dispose);
  if (relay) console.info("[Relayer] Relayer connected: " + config.relayServiceUrl);

  // Faucet setup
  const faucet = config.faucetServiceUrl ? createFaucetService(config.faucetServiceUrl) : undefined;

  if (config.devMode) {
    const playerIsBroke = (await network.signer.get()?.getBalance())?.lte(utils.parseEther("0.005"));
    if (playerIsBroke) {
      console.info("[Dev Faucet] Dripping funds to player");
      const address = network.connectedAddress.get();
      address && (await faucet?.dripDev({ address }));
    }
  }

  // --- ACTION SYSTEM --------------------------------------------------------------
  const actions = createActionSystem<{ actionType: string; coord?: VoxelCoord; blockType?: keyof typeof BlockType }>(
    world,
    txReduced$
  );

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

  function build(entity: EntityID, coord: VoxelCoord) {
    const entityIndex = world.entityToIndex.get(entity);
    if (entityIndex == null) return console.warn("trying to place unknown entity", entity);
    const blockId = getComponentValue(components.Item, entityIndex)?.value;
    const blockType = blockId != null ? BlockIdToKey[blockId as EntityID] : undefined;
    const godIndex = world.entityToIndex.get(GodID);
    const creativeMode = godIndex != null && getComponentValue(components.GameConfig, godIndex)?.creativeMode;

    actions.add({
      id: `build+${coord.x}/${coord.y}/${coord.z}` as EntityID,
      metadata: { actionType: "build", coord, blockType },
      requirement: () => true,
      components: { Position: components.Position, Item: components.Item, OwnedBy: components.OwnedBy },
      execute: () =>
        systems[creativeMode ? "system.CreativeBuild" : "system.Build"].executeTyped(BigNumber.from(entity), coord, {
          gasLimit: 500_000,
        }),
      updates: () => [
        {
          component: "OwnedBy",
          entity: entityIndex,
          value: { value: GodID },
        },
        {
          component: "Position",
          entity: entityIndex,
          value: coord,
        },
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
      execute: () => systems["system.Mine"].executeTyped(coord, blockId, { gasLimit: ecsBlock ? 400_000 : 1_000_000 }),
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
      id: `stake+${chunkCoord.x}/${chunkCoord.y}` as EntityID,
      metadata: { actionType: "claim", blockType: "Diamond" },
      requirement: () => true,
      components: {},
      execute: () => systems["system.Claim"].executeTyped(chunkCoord, { gasLimit: 400_000 }),
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
      transfer,
      getBlockAtPosition,
      getECSBlockAtPosition,
      getTerrainBlockAtPosition,
    },
    dev: setupDevSystems(world, encoders, systems),
    streams: { connectedClients$, balanceGwei$ },
    config,
    relay,
    worldAddress: config.worldAddress,
    ecsEvent$,
    mappings,
    faucet,
  };

  return context;
}
