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
import { CRAFTING_SIDE, EMPTY_CRAFTING_TABLE, Singleton } from "./constants";
import { setupHand } from "./engine/hand";
import { monkeyPatchMeshComponent } from "./engine/components/monkeyPatchMeshComponent";
import { registerRotationComponent, registerTargetedRotationComponent } from "./engine/components/rotationComponent";
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
import { setNoaPosition } from "./engine/components/utils";
import { registerTargetedPositionComponent } from "./engine/components/targetedPositionComponent";
import { defaultAbiCoder as abi, keccak256 } from "ethers/lib/utils";

export function createNoaLayer(network: NetworkLayer) {
  const world = namespaceWorld(network.world, "noa");
  const {
    worldAddress,
    network: {
      config: { chainId },
      connectedAddress,
    },
    components: { OwnedBy, Item, Recipe },
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
  // Because NOA and RECS currently use different ECS libraries we need to maintain a mapping of RECS ID to Noa ID
  // A future version of OPCraft will remove the NOA ECS library and use pure RECS only
  const mudToNoaId = new Map<number, number>();

  // Set initial values
  setComponent(components.UI, SingletonEntity, {
    showComponentBrowser: false,
    showInventory: false,
    showCrafting: false,
  });
  setComponent(components.SelectedSlot, SingletonEntity, { value: 0 });

  // --- API ------------------------------------------------------------------------
  function setCraftingTable(entities: EntityIndex[][]) {
    setComponent(components.CraftingTable, SingletonEntity, { value: entities.flat().slice(0, 9) });
  }

  function getCraftingTable(): EntityIndex[][] {
    const flatCraftingTable = (getComponentValue(components.CraftingTable, SingletonEntity)?.value || [
      ...EMPTY_CRAFTING_TABLE,
    ]) as EntityIndex[];

    const craftingTable: EntityIndex[][] = [];
    for (let i = 0; i < CRAFTING_SIDE; i++) {
      craftingTable.push([]);
      for (let j = 0; j < CRAFTING_SIDE; j++) {
        craftingTable[i].push(flatCraftingTable[i * CRAFTING_SIDE + j]);
      }
    }

    console.log("non-flat table", craftingTable);

    return craftingTable;
  }

  function setCraftingTableIndex(index: [number, number], entity: EntityIndex | undefined) {
    const craftingTable = getCraftingTable();
    console.log("crafting table before");
    console.table(craftingTable);
    craftingTable[index[0]][index[1]] = entity ?? (-1 as EntityIndex);
    console.log("crafting table after");
    console.table(craftingTable);
    setCraftingTable(craftingTable);
    console.log("get again");
    console.table(getCraftingTable());
    setCraftingTable(craftingTable);
    console.log("get again");
    console.table(getCraftingTable());
  }

  function clearCraftingTable() {
    removeComponent(components.CraftingTable, SingletonEntity);
  }

  function getTrimmedCraftingTable() {
    const craftingTable = getCraftingTable();
    // Trim the crafting table array
    let minX = -1;
    let maxX = -1;
    let minY = -1;
    let maxY = -1;

    for (let x = 0; x < CRAFTING_SIDE; x++) {
      for (let y = 0; y < CRAFTING_SIDE; y++) {
        if (craftingTable[x][y] !== -1) {
          if (minX === -1) minX = x;
          if (minY === -1) minY = y;
          maxX = x;
          maxY = y;
        }
      }
    }

    console.log("first non empty", minX, minY, maxX, maxY);
    if ([minX, minY, maxX, maxY].includes(-1)) return { items: [] as EntityID[][], types: [] as EntityID[][] };

    const trimmedCraftingTableItems: EntityID[][] = [];
    const trimmedCraftingTableTypes: EntityID[][] = [];
    for (let x = 0; x <= maxX - minX; x++) {
      trimmedCraftingTableItems.push([]);
      trimmedCraftingTableTypes.push([]);
      for (let y = 0; y <= maxY - minY; y++) {
        const blockIndex = craftingTable[x + minX][y + minY];
        const blockID = ((blockIndex !== -1 && world.entities[blockIndex]) || "0x00") as EntityID;
        const blockType = ((blockIndex !== -1 && getComponentValue(Item, blockIndex)?.value) || "0x00") as EntityID;
        trimmedCraftingTableItems[x].push(blockID);
        trimmedCraftingTableTypes[x].push(blockType);
      }
    }

    return { items: trimmedCraftingTableItems, types: trimmedCraftingTableTypes };
  }

  function getCraftingResult(): EntityID | undefined {
    const { types } = getTrimmedCraftingTable();

    // Abi-encode
    const abiEncodedCraftingTable = abi.encode(["uint256[][]"], [types]);

    console.log("abi encoded", abiEncodedCraftingTable);
    // Hash
    const hashed = keccak256(abiEncodedCraftingTable);
    console.log("hashed", hashed);
    const resultIndex = [...getEntitiesWithValue(Recipe, { value: hashed })][0];
    const resultID = resultIndex == null ? undefined : world.entities[resultIndex];
    console.log("result", resultID);
    return resultID;
  }

  function teleportRandom() {
    const coord = {
      x: random(10000, -10000),
      y: 150,
      z: random(10000, -10000),
    };
    setNoaPosition(noa, noa.playerEntity, coord);
  }

  function toggleInventory(open?: boolean, crafting?: boolean) {
    open = open ?? !getComponentValue(components.UI, SingletonEntity)?.showInventory;
    noa.container.setPointerLock(!open);
    updateComponent(components.UI, SingletonEntity, { showInventory: open, showCrafting: Boolean(open && crafting) });
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
  registerTargetedRotationComponent(noa);
  registerTargetedPositionComponent(noa);
  registerHandComponent(noa, getSelectedBlockType);
  registerMiningBlockComponent(noa, network);
  setupClouds(noa);
  setupSky(noa);
  setupHand(noa);
  setupSun(noa, glow);
  noa.entities.addComponentAgain(noa.playerEntity, MINING_BLOCK_COMPONENT, {});

  const context = {
    world,
    components,
    mudToNoaId,
    peer: {
      peerObject: {},
      connections: [],
    },
    noa,
    api: {
      setBlock,
      setCraftingTable,
      getCraftingTable,
      clearCraftingTable,
      setCraftingTableIndex,
      getTrimmedCraftingTable,
      getCraftingResult,
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
