import {
  createIndexer,
  EntityIndex,
  getComponentValue,
  namespaceWorld,
  removeComponent,
  setComponent,
  updateComponent,
} from "@latticexyz/recs";
import { random } from "@latticexyz/utils";
import { NetworkLayer } from "../network";
import {
  definePlayerDirectionComponent,
  definePlayerPositionComponent,
  defineSelectedSlotComponent,
  defineCraftingTableComponent,
  defineUIComponent,
} from "./components";
import { Singleton } from "./constants";
import { setupHand } from "./engine/hand";
import { monkeyPatchMeshComponent } from "./engine/components/monkeyPatchMeshComponent";
import { registerRotationComponent } from "./engine/components/rotationComponent";
import { setupClouds, setupSky } from "./engine/sky";
import { setupNoaEngine } from "./setup";
import {
  createBlockSystem,
  createInputSystem,
  createInventoryIndexSystem,
  createPlayerPositionSystem,
  createRelayerSystem,
} from "./systems";
import { registerHandComponent } from "./engine/components/handComponent";
import { registerModelComponent } from "./engine/components/modelComponent";
import { MINING_BLOCK_COMPONENT, registerMiningBlockComponent } from "./engine/components/miningBlockComponent";
import { defineInventoryIndexComponent } from "./components/InventoryIndex";

export function createNoaLayer(network: NetworkLayer) {
  const world = namespaceWorld(network.world, "noa");

  const SingletonEntity = world.registerEntity({ id: Singleton });

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedSlot: defineSelectedSlotComponent(world),
    CraftingTable: defineCraftingTableComponent(world),
    PlayerPosition: definePlayerPositionComponent(world),
    PlayerDirection: definePlayerDirectionComponent(world),
    UI: defineUIComponent(world),
    InventoryIndex: createIndexer(defineInventoryIndexComponent(world)),
  };

  // --- SETUP ----------------------------------------------------------------------
  const { noa, setBlock } = setupNoaEngine(network.api);
  // Modules
  monkeyPatchMeshComponent(noa);
  registerModelComponent(noa);
  registerRotationComponent(noa);
  registerHandComponent(noa, network, components.SelectedSlot, SingletonEntity);
  registerMiningBlockComponent(noa, network);
  setupClouds(noa);
  setupSky(noa);
  setupHand(noa);
  noa.entities.addComponentAgain(noa.playerEntity, MINING_BLOCK_COMPONENT, {});

  // Set initial values
  setComponent(components.UI, SingletonEntity, { showComponentBrowser: false, showInventory: false });
  setComponent(components.SelectedSlot, SingletonEntity, { value: 1 });

  // --- API ------------------------------------------------------------------------
  function setCraftingTable(entities: EntityIndex[]) {
    setComponent(components.CraftingTable, SingletonEntity, { value: entities.slice(0, 9) });
  }

  function setCraftingTableIndex(index: number, entity: EntityIndex) {
    const currentCraftingTable = getComponentValue(components.CraftingTable, SingletonEntity)?.value ?? [];
    const newCraftingTable = [...currentCraftingTable];
    newCraftingTable[index] = entity;
    setComponent(components.CraftingTable, SingletonEntity, { value: newCraftingTable });
  }

  function clearCraftingTable() {
    removeComponent(components.CraftingTable, SingletonEntity);
  }

  function teleportRandom() {
    const coord = {
      x: random(10000, -10000),
      y: 150,
      z: random(10000, -10000),
    };
    noa.entities.setPosition(noa.playerEntity, coord.x, coord.y, coord.z);
  }

  function toggleInventory(open?: boolean) {
    open = open ?? !getComponentValue(components.UI, SingletonEntity)?.showInventory;
    noa.container.setPointerLock(!open);
    updateComponent(components.UI, SingletonEntity, { showInventory: open });
  }

  const context = {
    world,
    components,
    peer: {
      peerObject: {},
      connections: [],
    },
    noa,
    api: { setBlock, setCraftingTable, clearCraftingTable, setCraftingTableIndex, teleportRandom, toggleInventory },
    SingletonEntity,
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createInputSystem(network, context);
  createBlockSystem(network, context);
  createPlayerPositionSystem(network, context);
  createRelayerSystem(network, context);
  createInventoryIndexSystem(network, context);

  return context;
}
