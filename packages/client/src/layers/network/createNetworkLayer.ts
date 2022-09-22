import { createIndexer, createWorld, EntityID, EntityIndex } from "@latticexyz/recs";
import { setupContracts, setupDevSystems } from "./setup";
import { createActionSystem } from "@latticexyz/std-client";
import { GameConfig } from "./config";
import { deferred, VoxelCoord } from "@latticexyz/utils";
import { BigNumber } from "ethers";
import {
  definePositionComponent,
  defineOwnedByComponent,
  defineGameConfigComponent,
  defineRecipeComponent,
  defineLoadingStateComponent,
  defineItemComponent,
  defineItemPrototypeComponent,
} from "./components";
import { defineNameComponent } from "./components/NameComponent";
import { getBlockAtPosition as getBlockAtPositionApi } from "./api";
import { createPerlin } from "@latticexyz/noise";
import { getECSBlock, getTerrain, getTerrainBlock } from "./api/terrain/getBlockAtPosition";
import { BlockType } from "./constants";
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
    Position: createIndexer(definePositionComponent(world)),
    ItemPrototype: defineItemPrototypeComponent(world),
    Item: defineItemComponent(world),
    Name: defineNameComponent(world),
    OwnedBy: defineOwnedByComponent(world),
    GameConfig: defineGameConfigComponent(world),
    Recipe: defineRecipeComponent(world),
    LoadingState: defineLoadingStateComponent(world),
  };

  // --- SETUP ----------------------------------------------------------------------
  const { txQueue, systems, txReduced$, network, startSync, encoders } = await setupContracts(
    config,
    world,
    components
  );

  // --- ACTION SYSTEM --------------------------------------------------------------
  const actions = createActionSystem(world, txReduced$);

  // --- API ------------------------------------------------------------------------

  const perlin = await createPerlin();
  const { withOptimisticUpdates } = actions;
  const terrainContext = {
    Position: withOptimisticUpdates(components.Position),
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

    actions.add({
      id: `build+${coord.x}/${coord.y}/${coord.z}` as EntityID,
      requirement: () => true,
      components: { Position: components.Position, Item: components.Item, OwnedBy: components.OwnedBy },
      execute: () => systems["system.Build"].executeTyped(BigNumber.from(entity), coord, { gasLimit: 450000 }),
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
    const blockType = ecsBlock ?? getTerrainBlockAtPosition(coord);

    console.log("entity/blocktype", blockType);
    if (blockType == null) throw new Error("entity has no block type");

    const airEntity = world.registerEntity();

    actions.add({
      id: `mine+${coord.x}/${coord.y}/${coord.z}` as EntityID,
      requirement: () => true,
      components: { Position: components.Position, OwnedBy: components.OwnedBy, Item: components.Item },
      execute: () => systems["system.Mine"].executeTyped(coord, blockType, { gasLimit: ecsBlock ? 450000 : 1100000 }),
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

  async function craft(ingredients: EntityIndex[], result: EntityID) {
    const [resolve, , promise] = deferred();
    actions.add({
      id: `craft+${ingredients.join("/")}` as EntityID,
      requirement: () => true,
      components: {},
      execute: () => {
        const tx = systems["ember.system.craft"].executeTyped(
          ingredients.map((i) => BigNumber.from(world.entities[i])),
          BigNumber.from(result),
          { gasLimit: 1_000_000 }
        );
        // Hacky af, improve this
        tx.then((r) => r.wait().then(resolve));
        return tx;
      },
      updates: () => [],
    });

    return promise;
  }

  function name(name: string) {
    systems["ember.system.name"].executeTyped(name);
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
    api: { build, mine, craft, name, getBlockAtPosition, getECSBlockAtPosition, getTerrainBlockAtPosition },
    dev: setupDevSystems(world, encoders, systems),
    config,
  };

  return context;
}
