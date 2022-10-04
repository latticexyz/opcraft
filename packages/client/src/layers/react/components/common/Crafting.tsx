import React, { useEffect } from "react";
import { GodID } from "@latticexyz/network";
import { EntityIndex, EntityID, getComponentValue, runQuery, HasValue } from "@latticexyz/recs";
import { range } from "@latticexyz/utils";
import styled from "styled-components";
import { Layers } from "../../../../types";
import { Slot } from "./Slot";

export const Crafting: React.FC<{
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
  const craftingResult = getCraftingResult();

  function getX(i: number) {
    return Math.floor(i / sideLength);
  }

  function getY(i: number) {
    return i % sideLength;
  }

  function handleInput(i: number) {
    const x = getX(i);
    const y = getY(i);

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
    if (!craftingResult) return;
    const { items } = getTrimmedCraftingTable();
    clearCraftingTable();
    await craft(items, craftingResult);
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
