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
  removeComponent,
  SchemaOf,
  setComponent,
  updateComponent,
  withValue,
} from "@latticexyz/recs";
import { setupDevSystems } from "./setup";
import { createActionSystem, waitForActionCompletion } from "@latticexyz/std-client";
import { GameConfig } from "./config";
import { filterNullishValues, VoxelCoord } from "@latticexyz/utils";
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
  definePosition2DComponent,
  defineChunkComponent,
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
import { GodID } from "@latticexyz/network";
import { of } from "rxjs";
import { createInitSystem, createPluginSystem } from "./systems";

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
  const SingletonEntity = world.registerEntity({ id: GodID });

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    Position: definePositionComponent(world),
    Position2D: definePosition2DComponent(world),
    Item: defineItemComponent(world),
    Chunk: defineChunkComponent(world),
    ItemPrototype: defineItemPrototypeComponent(world),
    Name: defineNameComponent(world),
    OwnedBy: defineOwnedByComponent(world),
    GameConfig: defineGameConfigComponent(world),
    Recipe: defineRecipeComponent(world),
    LoadingState: defineLoadingStateComponent(world),
    Occurrence: defineOccurrenceComponent(world),
    Stake: defineStakeComponent(world),
    Claim: defineClaimComponent(world),
    Plugin: definePluginComponent(world),
    PluginRegistry: definePluginRegistryComponent(world),
  };

  // --- SETUP ----------------------------------------------------------------------
  // const {
  //   txQueue,
  //   systems,
  //   txReduced$,
  //   network,
  //   startSync,
  //   encoders,
  //   ecsEvent$,
  //   mappings,
  //   registerComponent,
  //   registerSystem,
  // } = await setupMUDNetwork<typeof components, SystemTypes>(getNetworkConfig(config), world, components, SystemAbis, {
  //   initialGasPrice: 2_000_000,
  // });

  // Relayer setup
  // const playerAddress = network.connectedAddress.get();
  // const playerSigner = network.signer.get();
  // let relay: Awaited<ReturnType<typeof createRelayStream>> | undefined;
  // try {
  //   relay =
  //     config.relayServiceUrl && playerAddress && playerSigner
  //       ? await createRelayStream(playerSigner, config.relayServiceUrl, playerAddress)
  //       : undefined;
  // } catch (e) {
  //   console.error(e);
  // }

  // relay && world.registerDisposer(relay.dispose);
  // if (relay) console.info("[Relayer] Relayer connected: " + config.relayServiceUrl);

  // Faucet setup
  // const faucet = config.faucetServiceUrl ? createFaucetService(config.faucetServiceUrl) : undefined;

  // if (config.devMode) {
  //   const playerIsBroke = (await network.signer.get()?.getBalance())?.lte(utils.parseEther("0.005"));
  //   if (playerIsBroke) {
  //     console.info("[Dev Faucet] Dripping funds to player");
  //     const address = network.connectedAddress.get();
  //     address && (await faucet?.dripDev({ address }));
  //   }
  // }

  // Set initial component values
  // if (components.PluginRegistry.entities.length === 0) {
  //   addPluginRegistry("https://opcraft-plugins.mud.dev");
  // }

  // Enable chat plugin by default
  // if (
  //   getEntitiesWithValue(components.Plugin, { host: "https://opcraft-plugins.mud.dev", path: "/chat.js" }).size === 0
  // ) {
  //   console.info("Enabling chat plugin by default");
  //   addPlugin({
  //     host: "https://opcraft-plugins.mud.dev",
  //     path: "/chat.js",
  //     active: true,
  //     source: "https://github.com/latticexyz/opcraft-plugins",
  //   });
  // }

  // --- ACTION SYSTEM --------------------------------------------------------------
  const actions = createActionSystem<{
    actionType: string;
    coord?: VoxelCoord;
    blockType?: keyof typeof BlockType;
    // }>(world, txReduced$);
  }>(world, of());

  // Add indexers and optimistic updates
  const { withOptimisticUpdates } = actions;
  components.Position = createIndexer(withOptimisticUpdates(components.Position));
  components.Position2D = createIndexer(withOptimisticUpdates(components.Position2D));
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

    actions.add({
      id: `build+${coord.x}/${coord.y}/${coord.z}` as EntityID,
      metadata: { actionType: "build", coord, blockType },
      requirement: () => true,
      components: { Position: components.Position, Item: components.Item, OwnedBy: components.OwnedBy },
      execute: () => {
        setComponent(components.OwnedBy, entityIndex, { value: GodID });
        setComponent(components.Position, entityIndex, coord);
      },
      updates: () => [],
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
      execute: () => {
        setComponent(components.Position, airEntity, coord);
        setComponent(components.Item, airEntity, { value: BlockType.Air });
        blockEntity != null && removeComponent(components.Position, blockEntity);
      },
      updates: () => [],
    });
  }

  async function craft(ingredients: EntityID[][], result: EntityID) {
    const entities = filterNullishValues(ingredients.flat().map((id) => world.entityToIndex.get(id)));

    const id = actions.add({
      id: `craft ${entities.join("/")}` as EntityID,
      metadata: { actionType: "craft", blockType: BlockIdToKey[result] },
      requirement: () => true,
      components: { OwnedBy: components.OwnedBy },
      execute: () => {
        for (const entity of entities) {
          setComponent(components.OwnedBy, entity, { value: GodID });
        }
      },
      updates: () => [],
    });

    await waitForActionCompletion(actions.Action, id);
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

  // --- CONTEXT --------------------------------------------------------------------
  const context = {
    world,
    components,
    // txQueue,
    // systems,
    // txReduced$,
    // startSync,
    // network,
    actions,
    api: {
      build,
      mine,
      craft,
      // stake,
      // claim,
      // transfer,
      getBlockAtPosition,
      getECSBlockAtPosition,
      getTerrainBlockAtPosition,
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
      // registerComponent,
      // registerSystem,
    },
    dev: setupDevSystems(world, new Promise((resolve) => resolve({})), {} as any),
    // streams: { connectedClients$, balanceGwei$ },
    config,
    // relay,
    worldAddress: config.worldAddress,
    // ecsEvent$,
    // mappings,
    // faucet,
    uniqueWorldId,
    types: { BlockIdToKey, BlockType },
    perlin,
    SingletonEntity,
  };

  // --- SYSTEMS --------------------------------------------------------------------
  // createPluginSystem(context);
  setTimeout(() => createInitSystem(context), 1000);

  return context;
}
