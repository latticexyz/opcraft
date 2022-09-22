import React from "react";
import { registerUIComponent } from "../engine";
import { map, merge, of } from "rxjs";
import { BlockIcon, Center, GUI } from "./common/GUI";
import styled from "styled-components";
import { range } from "@latticexyz/utils";
import { defineQuery, getComponentValue, HasValue } from "@latticexyz/recs";
import { BlockType } from "../../network";
import { BlockTypeKey } from "../../network/constants";

const SCALE = 3;
export const INDEX_TO_BLOCK: { [key: number]: typeof BlockType[BlockTypeKey] } = {
  1: BlockType.Grass,
  3: BlockType.RedFlower,
  2: BlockType.Log,
  4: BlockType.Sand,
  5: BlockType.Cobblestone,
  6: BlockType.Leaves,
  7: BlockType.Crafting,
  8: BlockType.Stone,
  9: BlockType.Water,
  10: BlockType.Dirt,
  11: BlockType.Coal,
  12: BlockType.Iron,
  13: BlockType.Gold,
  14: BlockType.Diamond,
};

export function registerActionBar() {
  registerUIComponent(
    "ActionBar",
    {
      rowStart: 12,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const {
        network: {
          network: { connectedAddress },
          components: { OwnedBy, Item },
        },
        noa: {
          components: { SelectedSlot },
          SingletonEntity,
        },
      } = layers;

      const ownedByMeQuery = defineQuery([HasValue(OwnedBy, { value: connectedAddress.get() })]);

      return merge(of(0), ownedByMeQuery.update$, SelectedSlot.update$).pipe(
        map(() => {
          return {
            selectedSlot: getComponentValue(SelectedSlot, SingletonEntity)?.value ?? 1,
            quantityPerType: [...ownedByMeQuery.matching].reduce<{ [key: string]: number }>((acc, entity) => {
              const blockID = getComponentValue(Item, entity)?.value;
              if (blockID == null) return acc;
              acc[blockID] = (acc[blockID] ?? 0) + 1;
              return acc;
            }, {}),
          };
        })
      );
    },
    ({ selectedSlot, quantityPerType }) => {
      return (
        <Center>
          <Wrapper>
            <GUI _x={0} _y={0} _height={22} _width={182} scale={SCALE}></GUI>
            {[...range(9, 1, 1)].map((i) => (
              <Slot pos={i} key={"slot" + i}>
                {quantityPerType[INDEX_TO_BLOCK[i]] > 0 ? (
                  <BlockIcon blockID={INDEX_TO_BLOCK[i]} scale={SCALE}>
                    {quantityPerType[INDEX_TO_BLOCK[i]] ?? 0}
                  </BlockIcon>
                ) : null}
              </Slot>
            ))}
            <Slot pos={selectedSlot}>
              <GUI _x={0} _y={22} _height={24} _width={24} scale={SCALE}></GUI>
            </Slot>
          </Wrapper>
        </Center>
      );
    }
  );
}

const Wrapper = styled.div`
  position: relative;
  padding: 2px;
`;

const Slot = styled.div<{ pos: number }>`
  position: absolute;
  left: ${(p) => (p.pos - 1) * SCALE * 20}px;
  top: 0;
`;
