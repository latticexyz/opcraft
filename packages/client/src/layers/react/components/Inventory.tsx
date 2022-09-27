import React from "react";
import { registerUIComponent } from "../engine";
import { filter, map, merge, withLatestFrom } from "rxjs";
import styled from "styled-components";
import { BlockIcon, Center } from "./common";
import { range } from "@latticexyz/utils";
import { EntityID, getComponentValue, getEntitiesWithValue } from "@latticexyz/recs";

// const SCALE = 3;
const INVENTORY_WIDTH = 9;
const INVENTORY_HEIGHT = 3;

export function registerInventory() {
  registerUIComponent(
    "Inventory",
    {
      colStart: 1,
      colEnd: 13,
      rowStart: 1,
      rowEnd: 13,
    },
    (layers) => {
      const {
        network: {
          components: { OwnedBy },
          network: { connectedAddress },
        },
        noa: {
          components: { UI },
        },
      } = layers;

      const address = connectedAddress.get();
      const ownedByMe$ = OwnedBy.update$.pipe(filter((e) => [e.value[0]?.value, e.value[1]?.value].includes(address)));
      const showInventory$ = UI.update$.pipe(map((e) => ({ layers, show: e.value[0]?.showInventory })));

      return merge(ownedByMe$, showInventory$).pipe(
        withLatestFrom(showInventory$),
        map(([, b]) => b)
      );
    },
    ({ layers, show }) => {
      const {
        network: {
          components: { OwnedBy, Item },
          network: { connectedAddress },
        },
        noa: {
          api: { toggleInventory },
        },
      } = layers;
      const ownedByMeQuery = getEntitiesWithValue(OwnedBy, { value: connectedAddress.get() });

      const quantityPerType = Object.entries(
        [...ownedByMeQuery].reduce<{ [key: string]: number }>((acc, entity) => {
          const blockID = getComponentValue(Item, entity)?.value;
          if (blockID == null) return acc;
          acc[blockID] = (acc[blockID] ?? 0) + 1;
          return acc;
        }, {})
      );

      console.log("Ownes", quantityPerType);

      function close() {
        toggleInventory(false);
      }

      return show ? (
        <Center>
          <Background onClick={close} />
          <Border color={"#999999"} style={{ zIndex: 1 }}>
            <Wrapper>
              {[...range(INVENTORY_WIDTH * INVENTORY_HEIGHT)].map((i) => (
                <Border key={"slot" + i} color={"lightgray"}>
                  <Border color={"#999999"}>
                    <Slot>
                      {quantityPerType[i] ? (
                        <>
                          <BlockIcon blockID={quantityPerType[i][0] as EntityID} scale={3}></BlockIcon>
                          <p>{quantityPerType[i][1]}</p>
                        </>
                      ) : null}
                    </Slot>
                  </Border>
                </Border>
              ))}
            </Wrapper>
          </Border>
        </Center>
      ) : null;
    }
  );
}

const Wrapper = styled.div`
  background-color: rgb(0 0 0 / 40%);
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  align-items: center;
  pointer-events: all;
  border: 5px lightgray solid;
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
