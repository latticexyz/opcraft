import { EntityIndex, getComponentValue, namespaceWorld, removeComponent, setComponent } from "@latticexyz/recs";
import { NetworkLayer } from "../network";
import {
  definePlayerDirectionComponent,
  definePlayerPositionComponent,
  defineSelectedSlotComponent,
} from "./components";
import { defineCraftingTableComponent } from "./components/CraftingTable";
import { Singleton } from "./constants";
import { setupHand } from "./engine/hand";
import { monkeyPatchMeshComponent } from "./engine/components/monkeyPatchMeshComponent";
import { registerRotationComponent } from "./engine/components/rotationComponent";
import { setupClouds, setupSky } from "./engine/sky";
import { setupNoaEngine } from "./setup";
import { createBlockSystem, createInputSystem, createP2PSystem, createPlayerPositionSystem } from "./systems";
import { registerHandComponent } from "./engine/components/handComponent";
import { registerModelComponent } from "./engine/components/modelComponent";
import { MINING_BLOCK_COMPONENT, registerMiningBlockComponent } from "./engine/components/miningBlockComponent";

export function createNoaLayer(network: NetworkLayer) {
  const world = namespaceWorld(network.world, "noa");

  const SingletonEntity = world.registerEntity({ id: Singleton });

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedSlot: defineSelectedSlotComponent(world),
    CraftingTable: defineCraftingTableComponent(world),
    PlayerPosition: definePlayerPositionComponent(world),
    PlayerDirection: definePlayerDirectionComponent(world),
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
