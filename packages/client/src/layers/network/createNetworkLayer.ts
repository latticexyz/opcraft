import { createIndexer, createWorld, EntityID, getComponentValue } from "@latticexyz/recs";
import { setupContracts, setupDevSystems } from "./setup";
import { createActionSystem } from "@latticexyz/std-client";
import { GameConfig } from "./config";
import { VoxelCoord } from "@latticexyz/utils";
import { BigNumber } from "ethers";
import {
  definePositionComponent,
  defineOwnedByComponent,
  defineGameConfigComponent,
  defineRecipeComponent,
  defineLoadingStateComponent,
  defineItemComponent,
  defineItemPrototypeComponent,
  defineOccurrenceComponent,
} from "./components";
import { defineNameComponent } from "./components/NameComponent";
import { getBlockAtPosition as getBlockAtPositionApi, getECSBlock, getTerrain, getTerrainBlock } from "./api";
import { createPerlin } from "@latticexyz/noise";
import { BlockIdToKey, BlockType } from "./constants";
import { GodID } from "@latticexyz/network";

/**
 * The Network layer is the lowest layer in the client architecture.
 * Its purpose is to synchronize the client components with the contract components.
 */
export async function createNetworkLayer(config: GameConfig) {
  console.log("Network config", config);

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
  };

  const indexers = {
    Position: createIndexer(components.Position),
    OwnedBy: createIndexer(components.OwnedBy),
  };

  // --- SETUP ----------------------------------------------------------------------
  const { txQueue, systems, txReduced$, network, startSync, encoders } = await setupContracts(
    config,
    world,
    components
  );

  // --- ACTION SYSTEM --------------------------------------------------------------
  const actions = createActionSystem<{ actionType: string; coord?: VoxelCoord; blockType?: keyof typeof BlockType }>(
    world,
    txReduced$
  );

  // --- API ------------------------------------------------------------------------

  const perlin = await createPerlin();
  const { withOptimisticUpdates } = actions;
  const terrainContext = {
    Position: withOptimisticUpdates(indexers.Position),
    Item: withOptimisticUpdates(components.Item),
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
      execute: () => systems["system.Build"].executeTyped(BigNumber.from(entity), coord),
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

    const airEntity = world.registerEntity();

    actions.add({
      id: `mine+${coord.x}/${coord.y}/${coord.z}` as EntityID,
      metadata: { actionType: "mine", coord, blockType },
      requirement: () => true,
      components: { Position: components.Position, OwnedBy: components.OwnedBy, Item: components.Item },
      execute: () => systems["system.Mine"].executeTyped(coord, blockId),
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
      ],
    });
  }

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
    api: { build, mine, getBlockAtPosition, getECSBlockAtPosition, getTerrainBlockAtPosition },
    dev: setupDevSystems(world, encoders, systems),
    config,
    indexers,
  };

  return context;
}
