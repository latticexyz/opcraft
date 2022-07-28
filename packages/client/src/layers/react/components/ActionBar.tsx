import React from "react";
import { registerUIComponent } from "../engine";
import { map, merge, of } from "rxjs";
import { BlockIcon, Center, GUI } from "./common/GUI";
import styled from "styled-components";
import { range } from "@latticexyz/utils";
import { defineQuery, getComponentValue, HasValue } from "@latticexyz/recs";

const SCALE = 3;

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
            {[...range(9, 1, 1)].map((i) => (
              <Slot pos={i} key={"slot" + i}>
                <BlockIcon blockType={i} scale={SCALE}>
                  {quantityPerType[i] ?? 0}
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
