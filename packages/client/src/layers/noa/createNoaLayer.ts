import {
  createIndexer,
  EntityIndex,
  getComponentValue,
  namespaceWorld,
  removeComponent,
  setComponent,
  updateComponent,
  createLocalCache,
  getEntitiesWithValue,
  runQuery,
  HasValue,
  EntityID,
} from "@latticexyz/recs";
import { random, VoxelCoord } from "@latticexyz/utils";
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
  createRelaySystem,
} from "./systems";
import { registerHandComponent } from "./engine/components/handComponent";
import { registerModelComponent } from "./engine/components/modelComponent";
import { MINING_BLOCK_COMPONENT, registerMiningBlockComponent } from "./engine/components/miningBlockComponent";
import { defineInventoryIndexComponent } from "./components/InventoryIndex";
import { setupSun } from "./engine/dayNightCycle";

export function createNoaLayer(network: NetworkLayer) {
  const world = namespaceWorld(network.world, "noa");
  const {
    worldAddress,
    network: {
      config: { chainId },
      connectedAddress,
    },
    components: { OwnedBy, Item },
    api: { build },
  } = network;
  const uniqueWorldId = chainId + worldAddress;

  const SingletonEntity = world.registerEntity({ id: Singleton });

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedSlot: defineSelectedSlotComponent(world),
    CraftingTable: defineCraftingTableComponent(world),
    PlayerPosition: definePlayerPositionComponent(world),
    PlayerDirection: definePlayerDirectionComponent(world),
    UI: defineUIComponent(world),
    InventoryIndex: createLocalCache(createIndexer(defineInventoryIndexComponent(world)), uniqueWorldId),
  };

  // --- SETUP ----------------------------------------------------------------------
  const { noa, setBlock, glow } = setupNoaEngine(network.api);

  // Set initial values
  setComponent(components.UI, SingletonEntity, { showComponentBrowser: false, showInventory: false });
  setComponent(components.SelectedSlot, SingletonEntity, { value: 0 });

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

  function getSelectedBlockType(): EntityID | undefined {
    const selectedSlot = getComponentValue(components.SelectedSlot, SingletonEntity)?.value;
    if (selectedSlot == null) return;
    const blockIndex = [...getEntitiesWithValue(components.InventoryIndex, { value: selectedSlot })][0];
    const blockID = blockIndex != null && world.entities[blockIndex];
    if (!blockID) return;
    return blockID;
  }

  function placeSelectedItem(coord: VoxelCoord) {
    const blockID = getSelectedBlockType();
    if (!blockID) return console.warn("No item at selected slot");
    const ownedEntityOfSelectedType = [
      ...runQuery([HasValue(OwnedBy, { value: connectedAddress.get() }), HasValue(Item, { value: blockID })]),
    ][0];
    if (ownedEntityOfSelectedType == null) return console.warn("No owned item of type", blockID);
    const itemEntity = world.entities[ownedEntityOfSelectedType];
    build(itemEntity, coord);
  }

  // --- SETUP NOA CONSTANTS --------------------------------------------------------
  monkeyPatchMeshComponent(noa);
  registerModelComponent(noa);
  registerRotationComponent(noa);
  registerHandComponent(noa, getSelectedBlockType);
  registerMiningBlockComponent(noa, network);
  setupClouds(noa);
  setupSky(noa);
  setupHand(noa);
  setupSun(noa, glow)
  noa.entities.addComponentAgain(noa.playerEntity, MINING_BLOCK_COMPONENT, {});

  const context = {
    world,
    components,
    peer: {
      peerObject: {},
      connections: [],
    },
    noa,
    api: {
      setBlock,
      setCraftingTable,
      clearCraftingTable,
      setCraftingTableIndex,
      teleportRandom,
      toggleInventory,
      placeSelectedItem,
    },
    SingletonEntity,
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createInputSystem(network, context);
  createBlockSystem(network, context);
  createPlayerPositionSystem(network, context);
  createRelaySystem(network, context);
  createInventoryIndexSystem(network, context);

  return context;
}
