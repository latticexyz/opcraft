import { createIndexer, createWorld, EntityID, EntityIndex } from "@latticexyz/recs";
import { setupContracts, setupDevSystems } from "./setup";
import { createActionSystem } from "@latticexyz/std-client";
import { GameConfig } from "./config";
import { deferred, VoxelCoord } from "@latticexyz/utils";
import { BigNumber } from "ethers";
import {
  defineBlockTypeComponent,
  definePositionComponent,
  defineOwnedByComponent,
  defineGameConfigComponent,
  defineRecipeComponent,
} from "./components";
import { BlockType } from "./constants";
import { defineNameComponent } from "./components/NameComponent";
import { curry } from "lodash";
import { getBlockAtPosition } from "./api";

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
    Name: defineNameComponent(world),
    BlockType: defineBlockTypeComponent(world),
    OwnedBy: defineOwnedByComponent(world),
    GameConfig: defineGameConfigComponent(world),
    Recipe: defineRecipeComponent(world),
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
  function build(entity: EntityID, coord: VoxelCoord, type: BlockType) {
    // We have to pass an entity and the block type because we're mixing
    // the build system for creative and "survival" mode. Would be cleaner and
    // cheaper to separate, but hackweek
    const entityIndex = world.entityToIndex.get(entity) || (Number.MAX_SAFE_INTEGER as EntityIndex);
    actions.add({
      id: `build+${coord.x}/${coord.y}/${coord.z}` as EntityID,
      requirement: () => true,
      components: { Position: components.Position, BlockType: components.BlockType, OwnedBy: components.OwnedBy },
      execute: () => systems["ember.system.build"].executeTyped(BigNumber.from(entity), coord, type),
      updates: () => [
        {
          component: "BlockType",
          entity: entityIndex,
          value: { value: type },
        },
        {
          component: "OwnedBy",
          entity: entityIndex,
          value: { value: "0x60D" },
        },
        {
          component: "Position",
          entity: entityIndex,
          value: coord,
        },
      ],
    });
  }

  function mine(coord: VoxelCoord) {
    const entityAtPos = [...components.Position.getEntitiesWithValue(coord)][0];
    const blockType = entityAtPos == null ? getBlockAtPosition(components, coord) : 0;
    console.log("entity/blocktype", entityAtPos, blockType);
    const airEntity = world.registerEntity();
    actions.add({
      id: `mine+${coord.x}/${coord.y}/${coord.z}` as EntityID,
      requirement: () => true,
      components: { Position: components.Position, OwnedBy: components.OwnedBy, BlockType: components.BlockType },
      execute: () => systems["ember.system.mine"].executeTyped(coord, blockType),
      updates: () => [
        {
          component: "Position",
          entity: airEntity,
          value: coord,
        },
        {
          component: "BlockType",
          entity: airEntity,
          value: { value: BlockType.Air },
        },
        {
          component: "OwnedBy",
          entity: entityAtPos,
          value: { value: network.connectedAddress.get() },
        },
      ],
    });
  }

  function move(coord: VoxelCoord) {
    // systems["ember.system.move"].executeTyped(coord);
  }

  async function craft(ingredients: EntityIndex[], result: BlockType) {
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
    api: { build, mine, move, craft, name, getBlockAtPosition: curry(getBlockAtPosition)(components) },
    dev: setupDevSystems(world, encoders, systems),
    config,
  };

  return context;
}
