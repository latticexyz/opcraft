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
  getComponentValueStrict,
  hasComponent,
} from "@latticexyz/recs";
import { Coord, random, VoxelCoord } from "@latticexyz/utils";
import { NetworkLayer } from "../network";
import {
  definePlayerDirectionComponent,
  definePlayerPositionComponent,
  defineSelectedSlotComponent,
  defineCraftingTableComponent,
  defineUIComponent,
  definePlayerLastMessage,
  definePlayerRelayerChunkPositionComponent,
  defineLocalPlayerPositionComponent,
} from "./components";
import { CRAFTING_SIDE, EMPTY_CRAFTING_TABLE } from "./constants";
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
  createSyncLocalPlayerPositionSystem,
} from "./systems";
import { registerHandComponent } from "./engine/components/handComponent";
import { registerModelComponent } from "./engine/components/modelComponent";
import { MINING_BLOCK_COMPONENT, registerMiningBlockComponent } from "./engine/components/miningBlockComponent";
import { defineInventoryIndexComponent } from "./components/InventoryIndex";
import { setupDayNightCycle } from "./engine/dayNightCycle";
import { getNoaPositionStrict, setNoaPosition } from "./engine/components/utils";
import { registerTargetedPositionComponent } from "./engine/components/targetedPositionComponent";
import { defaultAbiCoder as abi, keccak256 } from "ethers/lib/utils";
import { GodID } from "@latticexyz/network";
import { getChunkCoord, getChunkEntity } from "../../utils/chunk";
import { BehaviorSubject, map, throttleTime, timer } from "rxjs";
import { getStakeEntity } from "../../utils/stake";

export function createNoaLayer(network: NetworkLayer) {
  const world = namespaceWorld(network.world, "noa");
  const {
    worldAddress,
    network: {
      config: { chainId },
      connectedAddress,
    },
    components: { OwnedBy, Item, Recipe, Claim, Stake },
    api: { build },
  } = network;
  const uniqueWorldId = chainId + worldAddress;

  const SingletonEntity = world.registerEntity({ id: GodID });

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedSlot: defineSelectedSlotComponent(world),
    CraftingTable: defineCraftingTableComponent(world),
    PlayerPosition: definePlayerPositionComponent(world),
    LocalPlayerPosition: createLocalCache(defineLocalPlayerPositionComponent(world)),
    PlayerRelayerChunkPosition: createIndexer(definePlayerRelayerChunkPositionComponent(world)),
    PlayerDirection: definePlayerDirectionComponent(world),
    PlayerLastMessage: definePlayerLastMessage(world),
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

  if (hasComponent(components.LocalPlayerPosition, SingletonEntity)) {
    setNoaPosition(noa, noa.playerEntity, getComponentValueStrict(components.LocalPlayerPosition, SingletonEntity));
  }

  // --- API ------------------------------------------------------------------------
  function setCraftingTable(entities: EntityIndex[][]) {
    setComponent(components.CraftingTable, SingletonEntity, { value: entities.flat().slice(0, 9) });
  }

  // Get a 2d representation of the current crafting table
  // -1 corresponds to empty slots
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

    return craftingTable;
  }

  // Set 2d representation of crafting table
  function setCraftingTableIndex(index: [number, number], entity: EntityIndex | undefined) {
    const craftingTable = getCraftingTable();
    craftingTable[index[0]][index[1]] = entity ?? (-1 as EntityIndex);
    setCraftingTable(craftingTable);
  }

  function clearCraftingTable() {
    removeComponent(components.CraftingTable, SingletonEntity);
  }

  // Get a trimmed 2d representation of the crafting table
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

  // Get the block type the current crafting table ingredients hash to
  function getCraftingResult(): EntityID | undefined {
    const { types } = getTrimmedCraftingTable();

    // ABI encode and hash current trimmed crafting table
    const hash = keccak256(abi.encode(["uint256[][]"], [types]));

    // Check for block types with this recipe hash
    const resultIndex = [...getEntitiesWithValue(Recipe, { value: hash })][0];
    const resultID = resultIndex == null ? undefined : world.entities[resultIndex];
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

  function getCurrentPlayerPosition() {
    return getNoaPositionStrict(noa, noa.playerEntity);
  }

  function getCurrentChunk() {
    const position = getCurrentPlayerPosition();
    return getChunkCoord(position);
  }

  function getStakeAndClaim(chunk: Coord) {
    const chunkEntityIndex = world.entityToIndex.get(getChunkEntity(chunk));
    const claim = chunkEntityIndex == null ? undefined : getComponentValue(Claim, chunkEntityIndex);
    const stakeEntityIndex = world.entityToIndex.get(getStakeEntity(chunk, connectedAddress.get() || "0x00"));
    const stake = stakeEntityIndex == null ? undefined : getComponentValue(Stake, stakeEntityIndex);
    return { claim, stake };
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
  setupDayNightCycle(noa, glow);
  noa.entities.addComponentAgain(noa.playerEntity, MINING_BLOCK_COMPONENT, {});

  // --- SETUP STREAMS --------------------------------------------------------------
  // (Create streams as BehaviorSubject to allow for multiple observers and getting the current value)
  const playerPosition$ = new BehaviorSubject(getCurrentPlayerPosition());
  world.registerDisposer(timer(0, 200).pipe(map(getCurrentPlayerPosition)).subscribe(playerPosition$)?.unsubscribe);

  const slowPlayerPosition$ = playerPosition$.pipe(throttleTime(2000));

  const playerChunk$ = new BehaviorSubject(getCurrentChunk());
  world.registerDisposer(playerPosition$.pipe(map((pos) => getChunkCoord(pos))).subscribe(playerChunk$)?.unsubscribe);

  const stakeAndClaim$ = new BehaviorSubject(getStakeAndClaim(getCurrentChunk()));
  world.registerDisposer(
    playerChunk$.pipe(map((coord) => getStakeAndClaim(coord))).subscribe(stakeAndClaim$)?.unsubscribe
  );

  const context = {
    world,
    components,
    mudToNoaId,
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
      getCurrentChunk,
      getCurrentPlayerPosition,
      getStakeAndClaim,
    },
    streams: { playerPosition$, slowPlayerPosition$, playerChunk$, stakeAndClaim$ },
    SingletonEntity,
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createInputSystem(network, context);
  createBlockSystem(network, context);
  createPlayerPositionSystem(network, context);
  createRelaySystem(network, context);
  createInventoryIndexSystem(network, context);
  createSyncLocalPlayerPositionSystem(network, context);

  return context;
}
