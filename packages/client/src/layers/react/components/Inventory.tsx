import React, { useEffect, useState } from "react";
import { registerUIComponent } from "../engine";
import { combineLatest, concat, map, of, scan } from "rxjs";
import styled from "styled-components";
import { AbsoluteBorder, Center, Slot } from "./common";
import { range } from "@latticexyz/utils";
import {
  defineQuery,
  EntityID,
  EntityIndex,
  getComponentValue,
  getEntitiesWithValue,
  Has,
  HasValue,
  runQuery,
  setComponent,
  UpdateType,
} from "@latticexyz/recs";
import { getBlockIconUrl } from "../../noa/constants";
import { BlockIdToKey } from "../../network/constants";
import { Layers } from "../../../types";
import { GodID } from "@latticexyz/network";

// This gives us 36 inventory slots. As of now there are 34 types of items, so it should fit.
const INVENTORY_WIDTH = 9;
const INVENTORY_HEIGHT = 4;

export function registerInventory() {
  registerUIComponent(
    "Inventory",
    {
      rowStart: 12,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const {
        network: {
          components: { OwnedBy, Item },
          network: { connectedAddress },
        },
        noa: {
          components: { UI, InventoryIndex, SelectedSlot, CraftingTable },
        },
      } = layers;

      const ownedByMeQuery = defineQuery([HasValue(OwnedBy, { value: connectedAddress.get() }), Has(Item)], {
        runOnInit: true,
      });

      const ownedByMe$ = concat<{ [key: string]: number }[]>(
        of({}),
        ownedByMeQuery.update$.pipe(
          scan((acc, curr) => {
            const blockID = getComponentValue(Item, curr.entity)?.value;
            if (!blockID) return { ...acc };
            acc[blockID] = acc[blockID] || 0;
            if (curr.type === UpdateType.Exit) {
              acc[blockID]--;
              return { ...acc };
            }

            acc[blockID]++;
            return { ...acc };
          }, {} as { [key: string]: number })
        )
      );

      const showInventory$ = concat(
        of({ layers, show: false }),
        UI.update$.pipe(map((e) => ({ layers, show: e.value[0]?.showInventory })))
      );

      const inventoryIndex$ = concat(of(0), InventoryIndex.update$.pipe(map((e) => e.entity)));
      const selectedSlot$ = concat(of(0), SelectedSlot.update$.pipe(map((e) => e.value[0]?.value)));
      const craftingTable$ = concat(of(0), CraftingTable.update$);

      return combineLatest([ownedByMe$, showInventory$, selectedSlot$, inventoryIndex$, craftingTable$]).pipe(
        map((props) => ({ props }))
      );
    },
    ({ props }) => {
      const [ownedByMe, { layers, show }, selectedSlot] = props;

      const [holdingBlock, setHoldingBlock] = useState<EntityIndex | undefined>();

      useEffect(() => {
        if (!show) setHoldingBlock(undefined);
      }, [show]);

      useEffect(() => {
        if (holdingBlock == null) {
          document.body.style.cursor = "unset";
          return;
        }

        const blockID = world.entities[holdingBlock];
        const blockType = BlockIdToKey[blockID];
        const icon = getBlockIconUrl(blockType);
        document.body.style.cursor = `url(${icon}) 12 12, auto`;
      }, [holdingBlock]);

      const {
        noa: {
          world,
          api: { toggleInventory },
          components: { InventoryIndex },
        },
      } = layers;

      function close() {
        toggleInventory(false);
      }

      function moveItems(slot: number) {
        const blockAtSlot = [...getEntitiesWithValue(InventoryIndex, { value: slot })][0];
        const blockIDAtSlot = blockAtSlot == null ? null : layers.noa.world.entities[blockAtSlot];
        const ownedEntitiesOfType = blockIDAtSlot && ownedByMe[blockIDAtSlot];

        // If not currently holding a block, grab the block at this slot
        if (holdingBlock == null) {
          if (ownedEntitiesOfType) setHoldingBlock(blockAtSlot);
          return;
        }

        // Else (if currently holding a block), swap the holding block with the block at this position
        const holdingBlockSlot = getComponentValue(InventoryIndex, holdingBlock)?.value;
        if (holdingBlockSlot == null) {
          console.warn("holding block has no slot", holdingBlock);
          setHoldingBlock(undefined);
          return;
        }
        setComponent(InventoryIndex, holdingBlock, { value: slot });
        blockAtSlot && setComponent(InventoryIndex, blockAtSlot, { value: holdingBlockSlot });
        setHoldingBlock(undefined);
      }

      // Map each inventory slot to the corresponding block type at this slot index
      const Slots = [...range(INVENTORY_HEIGHT * INVENTORY_WIDTH)].map((i) => {
        const blockIndex: EntityIndex | undefined = [...getEntitiesWithValue(InventoryIndex, { value: i })][0];
        const blockID = blockIndex != null ? world.entities[blockIndex] : undefined;
        const quantity = blockID && ownedByMe[blockID];
        return (
          <Slot
            key={"slot" + i}
            blockID={quantity ? blockID : undefined}
            quantity={quantity || undefined}
            onClick={() => moveItems(i)}
            disabled={blockIndex === holdingBlock}
            selected={i === selectedSlot}
          />
        );
      });

      const Inventory = (
        <Absolute>
          <Center>
            <Background onClick={close} />
            <div>
              <AbsoluteBorder borderColor={"#999999"} borderWidth={3}>
                <Crafting
                  layers={layers}
                  holdingBlock={holdingBlock}
                  setHoldingBlock={setHoldingBlock}
                  sideLength={2}
                />
                <Wrapper>
                  {[...range(INVENTORY_WIDTH * (INVENTORY_HEIGHT - 1))]
                    .map((i) => i + INVENTORY_WIDTH)
                    .map((i) => Slots[i])}
                </Wrapper>
              </AbsoluteBorder>
            </div>
          </Center>
        </Absolute>
      );

      const ActionBar = (
        <Center>
          <Wrapper>{[...range(INVENTORY_WIDTH)].map((i) => Slots[i])}</Wrapper>
        </Center>
      );

      return (
        <>
          {show ? Inventory : null}
          {ActionBar}
        </>
      );
    }
  );
}

const Absolute = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
`;

const Wrapper = styled.div`
  background-color: rgb(0 0 0 / 40%);
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  align-items: center;
  pointer-events: all;
  border: 5px lightgray solid;
  z-index: 10;
`;

const Background = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  position: absolute;
  height: 100%;
  width: 100%;
  pointer-events: all;
`;

// TODO move into own component
const Crafting: React.FC<{
  layers: Layers;
  holdingBlock: EntityIndex | undefined;
  setHoldingBlock: (block: EntityIndex | undefined) => void;
  sideLength: number;
}> = ({ layers, holdingBlock, setHoldingBlock, sideLength }) => {
  const {
    network: {
      components: { OwnedBy, Item },
      actions: { withOptimisticUpdates },
      network: { connectedAddress },
      api: { craft },
    },
    noa: {
      api: { getCraftingTable, setCraftingTableIndex, clearCraftingTable, getCraftingResult, getTrimmedCraftingTable },
      world,
    },
  } = layers;

  const OptimisticOwnedBy = withOptimisticUpdates(OwnedBy);

  function getOverrideId(i: number) {
    return ("crafting" + i) as EntityID;
  }

  useEffect(() => {
    return () => {
      for (let i = 0; i < sideLength * sideLength; i++) {
        OptimisticOwnedBy.removeOverride(getOverrideId(i));
        clearCraftingTable();
      }
    };
  }, []);

  const craftingTable = getCraftingTable();

  function getX(i: number) {
    return Math.floor(i / sideLength);
  }

  function getY(i: number) {
    return i % sideLength;
  }

  function handleInput(i: number) {
    const x = getX(i);
    const y = getY(i);
    console.log("setting block", x, y);

    const blockAtIndex = craftingTable[x][y];
    const blockTypeAtIndex = getComponentValue(Item, blockAtIndex)?.value as EntityID | undefined;
    const blockTypeIndexAtIndex = blockTypeAtIndex && world.entityToIndex.get(blockTypeAtIndex);

    // If we are not holding a block but there is a block at this position, grab the block
    if (holdingBlock == null) {
      OptimisticOwnedBy.removeOverride(getOverrideId(i));
      setCraftingTableIndex([x, y], undefined);
      setHoldingBlock(blockTypeIndexAtIndex);
      return;
    }

    // If there already is a block of the current type at this position, remove the block
    if (blockTypeIndexAtIndex === holdingBlock) {
      OptimisticOwnedBy.removeOverride(getOverrideId(i));
      setCraftingTableIndex([x, y], undefined);
      return;
    }

    // Check if we still own an entity of the held block type
    const blockID = world.entities[holdingBlock];
    const ownedEntitiesOfType = [
      ...runQuery([HasValue(OptimisticOwnedBy, { value: connectedAddress.get() }), HasValue(Item, { value: blockID })]),
    ];

    // If we don't own a block of the held block type, ignore this click
    if (ownedEntitiesOfType.length === 0) {
      console.warn("no owned entities of type", blockID, holdingBlock);
      return;
    }

    // Set the optimisitic override for this crafting slot
    const ownedEntityOfType = ownedEntitiesOfType[0];
    OptimisticOwnedBy.removeOverride(getOverrideId(i));
    OptimisticOwnedBy.addOverride(getOverrideId(i), {
      entity: ownedEntityOfType,
      value: { value: GodID },
    });

    // Place the held block on the crafting table
    setCraftingTableIndex([x, y], ownedEntityOfType);

    // If this was the last block of this type we own, reset the cursor
    if (ownedEntitiesOfType.length === 1) {
      setHoldingBlock(undefined);
    }
  }

  async function handleOutput() {
    const { items } = getTrimmedCraftingTable();
    clearCraftingTable();
    await craft(items);
  }

  const Slots = [...range(sideLength * sideLength)].map((index) => {
    const x = getX(index);
    const y = getY(index);
    const blockIndex = craftingTable[x][y];
    const blockID = getComponentValue(Item, blockIndex)?.value as EntityID | undefined;
    return <Slot key={"crafting-slot" + index} blockID={blockID} onClick={() => handleInput(index)} />;
  });

  return (
    <CraftingWrapper>
      <CraftingInput sideLength={sideLength}>{[...range(sideLength * sideLength)].map((i) => Slots[i])}</CraftingInput>
      <CraftingOutput>
        <Slot blockID={getCraftingResult()} onClick={() => handleOutput()} selected={true} />
      </CraftingOutput>
    </CraftingWrapper>
  );
};

const CraftingWrapper = styled.div`
  width: 100%;
  background-color: lightgray;
  display: grid;
  grid-template-columns: repeat(2, auto);
  justify-content: center;
  align-items: center;
  grid-gap: 100px;
  padding: 20px;
  z-index: 11;
  pointer-events: all;
`;

const CraftingInput = styled.div<{ sideLength: number }>`
  background-color: rgb(0 0 0 / 40%);
  display: grid;
  grid-template-columns: repeat(${(p) => p.sideLength}, auto);
  align-items: start;
  justify-content: start;
  pointer-events: all;
  border: 5px lightgray solid;
  z-index: 10;
`;

const CraftingOutput = styled.div``;
