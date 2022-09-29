import React from "react";
import { registerUIComponent } from "../engine";
import { combineLatest, concat, map, of, scan } from "rxjs";
import styled from "styled-components";
import { BlockIcon, Center } from "./common";
import { range } from "@latticexyz/utils";
import {
  defineQuery,
  EntityID,
  EntityIndex,
  getComponentValue,
  getEntitiesWithValue,
  Has,
  hasComponent,
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
          components: { UI, InventoryIndex },
          world,
        },
      } = layers;

      const ownedByMeQuery = defineQuery([HasValue(OwnedBy, { value: connectedAddress.get() }), Has(Item)], {
        runOnInit: true,
      });

      // Setting the initial inventory index
      ownedByMeQuery.update$.pipe(map((e) => e.entity)).subscribe((entity) => {
        const blockID = getComponentValue(Item, entity)?.value as EntityID | undefined;
        const blockIndex = blockID && world.entityToIndex.get(blockID);
        if (blockIndex != null && !hasComponent(InventoryIndex, blockIndex)) {
          const values = [...InventoryIndex.values.value.values()]; // lol
          for (let i = 0; i < INVENTORY_HEIGHT * INVENTORY_WIDTH; i++) {
            if (!values.includes(i)) {
              return setComponent(InventoryIndex, blockIndex, { value: i });
            }
          }
        }
      });

      const ownedByMe$ = ownedByMeQuery.update$.pipe(
        scan((acc, curr) => {
          console.log("update", curr);
          console.log("entity", curr.entity);
          const blockID = getComponentValue(Item, curr.entity)?.value;
          console.log("blockid", blockID);
          if (!blockID) return acc;
          acc[blockID] = acc[blockID] || 0;
          if (curr.type === UpdateType.Exit) {
            acc[blockID]--;
            return acc;
          }

          acc[blockID]++;
          return acc;
        }, {} as { [key: string]: number })
      );

      const showInventory$ = concat(
        of({ layers, show: true }),
        UI.update$.pipe(map((e) => ({ layers, show: e.value[0]?.showInventory })))
      );

      return combineLatest([ownedByMe$, showInventory$, InventoryIndex.update$]);
    },
    ([ownedByMe, { layers, show }]) => {
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

      const Inventory = [...range(INVENTORY_WIDTH * (INVENTORY_HEIGHT - 1))]
        .map((i) => i + INVENTORY_WIDTH)
        .map((i) => {
          const blockIndex: EntityIndex | undefined = [...getEntitiesWithValue(InventoryIndex, { value: i })][0];
          const blockID = blockIndex != null ? world.entities[blockIndex] : undefined;

          return (
            // TODO: move to component
            <Border key={"slot" + i} color={"lightgray"}>
              <Border color={"#999999"}>
                <Slot>
                  {blockID && ownedByMe[blockID] ? (
                    <>
                      <BlockIcon blockID={blockID} scale={3.6}>
                        <Quantity>{ownedByMe[blockID]}</Quantity>
                      </BlockIcon>
                    </>
                  ) : null}
                </Slot>
              </Border>
            </Border>
          );
        });

      const ActionBar = (
        <Center>
          <Wrapper>
            {[...range(INVENTORY_WIDTH)].map((i) => {
              const blockIndex: EntityIndex | undefined = [...getEntitiesWithValue(InventoryIndex, { value: i })][0];
              const blockID = blockIndex != null ? world.entities[blockIndex] : undefined;

              return (
                <Border key={"slot" + i} color={"lightgray"}>
                  <Border color={"#999999"}>
                    <Slot>
                      {blockID && ownedByMe[blockID] ? (
                        <>
                          <BlockIcon blockID={blockID} scale={3.6}>
                            <Quantity>{ownedByMe[blockID]}</Quantity>
                          </BlockIcon>
                        </>
                      ) : null}
                    </Slot>
                  </Border>
                </Border>
              );
            })}
          </Wrapper>
        </Center>
      );

      return (
        <>
          {show ? (
            <Absolute>
              <Center>
                <Background onClick={close} />
                <Border color={"#999999"} style={{ zIndex: 1 }}>
                  <Wrapper>{Inventory}</Wrapper>
                </Border>
              </Center>
            </Absolute>
          ) : null}
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

const Slot = styled.div`
  width: 64px;
  height: 64px;
  display: grid;
  justify-items: center;
  align-items: center;
  font-size: 20px;
  border: 3px #626262 solid;
`;

const Border = styled.div<{ color: string }>`
  border: 3px ${(p) => p.color} solid;
`;

const Quantity = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  justify-content: end;
  align-content: end;
  padding: 7px 3px;
`;

// const Grid = styled.div`
//   display: grid;
//   grid-template-rows: repeat(3, 1fr);
//   grid-template-columns: repeat(3, 1fr);
// `;

// const Slot = styled.div<{ pos: number }>`
//   position: absolute;
//   left: ${(p) => (p.pos - 1) * SCALE * 20}px;
//   top: 0;
// `;

// const Block = styled(BlockIcon)`
//   position: absolute;
//   left: 0;
//   top: 0;
// `;

// const SlotWrapper = styled.div`
//   position: relative;
// `;
