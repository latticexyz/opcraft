import React from "react";
import { registerUIComponent } from "../engine";
import { map, merge, of } from "rxjs";
import { BlockIcon, Center, GUI } from "./common/GUI";
import styled from "styled-components";
import { range } from "@latticexyz/utils";
import { defineQuery, getComponentValue, HasValue } from "@latticexyz/recs";
import { BlockType } from "../../network";

const SCALE = 3;
export const INDEX_TO_BLOCK_TYPE: { [key: number]: BlockType } = {
  1: BlockType.Grass,
  2: BlockType.Log,
  3: BlockType.Planks,
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
          components: { OwnedBy, BlockType },
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
            quantityPerType: [...ownedByMeQuery.matching].reduce<number[]>((acc, entity) => {
              const blockType = getComponentValue(BlockType, entity)?.value;
              if (blockType == null) return acc;
              acc[blockType] = (acc[blockType] ?? 0) + 1;
              return acc;
            }, []),
          };
        })
      );
    },
    ({ selectedSlot, quantityPerType }) => {
      return (
        <Center>
          <Wrapper>
            <GUI _x={0} _y={0} _height={22} _width={182} scale={SCALE}></GUI>
            {[...range(14, 1, 1)].map((i) => (
              <Slot pos={i} key={"slot" + i}>
                <BlockIcon blockType={INDEX_TO_BLOCK_TYPE[i]} scale={SCALE}>
                  {quantityPerType[INDEX_TO_BLOCK_TYPE[i]] ?? 0}
                </BlockIcon>
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
