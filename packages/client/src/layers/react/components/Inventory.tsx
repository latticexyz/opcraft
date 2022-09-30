import React, { useEffect, useState } from "react";
import { registerUIComponent } from "../engine";
import { combineLatest, concat, map, of, scan } from "rxjs";
import styled from "styled-components";
import { Border, Center, Slot } from "./common";
import { range } from "@latticexyz/utils";
import {
  defineQuery,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  getEntitiesWithValue,
  Has,
  HasValue,
  setComponent,
  UpdateType,
} from "@latticexyz/recs";

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
          components: { UI, InventoryIndex, SelectedSlot },
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

      return combineLatest([ownedByMe$, showInventory$, selectedSlot$, inventoryIndex$]).pipe(
        map((props) => ({ props }))
      );
    },
    ({ props }) => {
      const [ownedByMe, { layers, show }, selectedSlot] = props;
      console.log("selected", selectedSlot);

      const [holdingBlock, setHoldingBlock] = useState<EntityIndex | undefined>();

      useEffect(() => {
        if (!show) setHoldingBlock(undefined);
      }, [show]);

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

        // If not currently holding a block, grab the block at this slot
        if (holdingBlock == null) {
          return setHoldingBlock(blockAtSlot);
        }

        // Else (if currently holding a block), swap the holding block with the block at this position
        const holdingBlockSlot = getComponentValueStrict(InventoryIndex, holdingBlock).value;
        setComponent(InventoryIndex, holdingBlock, { value: slot });
        blockAtSlot && setComponent(InventoryIndex, blockAtSlot, { value: holdingBlockSlot });
        setHoldingBlock(undefined);
      }

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
            <Border borderColor={"#999999"} style={{ zIndex: 1 }}>
              <Wrapper>
                {[...range(INVENTORY_WIDTH * (INVENTORY_HEIGHT - 1))]
                  .map((i) => i + INVENTORY_WIDTH)
                  .map((i) => Slots[i])}
              </Wrapper>
            </Border>
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
