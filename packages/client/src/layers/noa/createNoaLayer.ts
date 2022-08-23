import { EntityIndex, getComponentValue, namespaceWorld, removeComponent, setComponent } from "@latticexyz/recs";
import { NetworkLayer } from "../network";
import { definePlayerPositionComponent, defineSelectedSlotComponent } from "./components";
import { defineCraftingTableComponent } from "./components/CraftingTable";
import { Singleton } from "./constants";
import { defineModelComp } from "./engine/model";
import { setupClouds, setupSky } from "./engine/sky";
import { setupNoaEngine } from "./setup";
import { createBlockSystem, createInputSystem, createP2PSystem, createPlayerPositionSystem } from "./systems";

export function createNoaLayer(network: NetworkLayer) {
  const world = namespaceWorld(network.world, "noa");

  const SingletonEntity = world.registerEntity({ id: Singleton });

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedSlot: defineSelectedSlotComponent(world),
    CraftingTable: defineCraftingTableComponent(world),
    PlayerPosition: definePlayerPositionComponent(world),
  };

  // --- SETUP ----------------------------------------------------------------------
  const { noa, setBlock } = setupNoaEngine(network.api.getBlockAtPosition);
  // Modules
  setupClouds(noa);
  setupSky(noa);
  defineModelComp(noa);

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

  const context = {
    world,
    components,
    peer: {
      peerObject: {},
      connections: [],
    },
    noa,
    api: { setBlock, setCraftingTable, clearCraftingTable, setCraftingTableIndex },
    SingletonEntity,
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createInputSystem(network, context);
  createBlockSystem(network, context);
  createPlayerPositionSystem(network, context);
  createP2PSystem(network, context);

  return context;
}
