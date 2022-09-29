import React from "react";
import { registerUIComponent } from "../engine";
import { combineLatest, concat, map, of, scan } from "rxjs";
import styled from "styled-components";
import { BlockIcon, Center } from "./common";
import { range } from "@latticexyz/utils";
import { defineQuery, EntityID, getComponentValue, Has, HasValue, UpdateType } from "@latticexyz/recs";

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
          components: { UI },
        },
      } = layers;

      const ownedByMeQuery = defineQuery([HasValue(OwnedBy, { value: connectedAddress.get() }), Has(Item)], {
        runOnInit: true,
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

      return combineLatest([ownedByMe$, showInventory$]);
    },
    ([ownedByMe, { layers, show }]) => {
      const {
        noa: {
          api: { toggleInventory },
        },
      } = layers;
      const quantityPerType = Object.entries(ownedByMe);

      console.log("Ownes", quantityPerType);

      function close() {
        toggleInventory(false);
      }

      const Inventory = [...range(INVENTORY_WIDTH * (INVENTORY_HEIGHT - 1))]
        .map((i) => i + INVENTORY_WIDTH)
        .map((i) => (
          <Border key={"slot" + i} color={"lightgray"}>
            <Border color={"#999999"}>
              <Slot>
                {quantityPerType[i] ? (
                  <>
                    <BlockIcon blockID={quantityPerType[i][0] as EntityID} scale={3.6}>
                      <Quantity>{quantityPerType[i][1]}</Quantity>
                    </BlockIcon>
                  </>
                ) : null}
              </Slot>
            </Border>
          </Border>
        ));

      const ActionBar = (
        <Center>
          <Wrapper>
            {[...range(INVENTORY_WIDTH)].map((i) => (
              <Border key={"slot" + i} color={"lightgray"}>
                <Border color={"#999999"}>
                  <Slot>
                    {quantityPerType[i] ? (
                      <>
                        <BlockIcon blockID={quantityPerType[i][0] as EntityID} scale={3.6}>
                          <Quantity>{quantityPerType[i][1]}</Quantity>
                        </BlockIcon>
                      </>
                    ) : null}
                  </Slot>
                </Border>
              </Border>
            ))}
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
