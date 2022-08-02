import React from "react";
import { registerUIComponent } from "../engine";
import { map } from "rxjs";
import { BlockIcon, Center, GUI } from "./common/GUI";
import styled from "styled-components";
import { range } from "@latticexyz/utils";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { BlockType } from "../../network";
import { INDEX_TO_BLOCK_TYPE } from "./ActionBar";

const SCALE = 3;

export function registerCrafting() {
  registerUIComponent(
    "Crafting",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const {
        noa: {
          components: { CraftingTable },
          SingletonEntity,
        },
      } = layers;

      return CraftingTable.update$.pipe(
        map(() => ({
          craftingTable: getComponentValue(CraftingTable, SingletonEntity),
          layers,
        }))
      );
    },
    ({ craftingTable, layers }) => {
      if (!craftingTable) return null;
      console.log("crafting table", craftingTable.value);

      const {
        noa: {
          components: { SelectedSlot },
          SingletonEntity,
          api: { clearCraftingTable, setCraftingTableIndex },
          noa,
        },
        network: {
          components: { BlockType: BlockTypeComponent, OwnedBy, Recipe },
          network: { connectedAddress },
          api: { craft },
        },
      } = layers;

      function getBlockType(entity: EntityIndex) {
        return getComponentValue(BlockTypeComponent, entity)?.value ?? BlockType.Air;
      }

      function handleClick(index: number) {
        const selectedBlockType = INDEX_TO_BLOCK_TYPE[getComponentValue(SelectedSlot, SingletonEntity)?.value ?? 1];
        const ownedBlocksOfType = [
          ...runQuery([
            HasValue(OwnedBy, { value: connectedAddress.get() }),
            HasValue(BlockTypeComponent, { value: selectedBlockType }),
          ]),
        ];

        const uniqueBlockOfType = ownedBlocksOfType.find((b) => !craftingTable?.value.includes(b));

        console.log("Owned block of type", uniqueBlockOfType);

        if (!uniqueBlockOfType) return;

        setCraftingTableIndex(index, uniqueBlockOfType);
      }

      async function handleCraft() {
        const result = recipeResult();
        if (!craftingTable || recipeResult == null) {
          return console.warn("Invalid crafting request", craftingTable, recipeResult);
        }

        await craft(craftingTable.value as EntityIndex[], result as BlockType);
        clearCraftingTable();
        noa.container.setPointerLock(true);
      }

      const recipeResult = () => {
        const recipeEntities = getComponentEntities(Recipe);
        for (const recipeEntity of recipeEntities) {
          const recipe = getComponentValueStrict(Recipe, recipeEntity).value;
          let success = true;
          for (let i = 0; i < 9; i++) {
            if (recipe[i] !== getBlockType(craftingTable.value[i] as EntityIndex)) {
              success = false;
              break;
            }
          }
          if (success) return recipe[9];
        }
      };

      return (
        <Center>
          <Background
            onClick={() => {
              clearCraftingTable();
              noa.container.setPointerLock(true);
            }}
          />
          <Wrapper>
            <Grid>
              {[...range(9)].map((i) => (
                <SlotWrapper key={"craftingslot" + i} onClick={() => handleClick(i)}>
                  <GUI _x={188} _y={184} _height={22} _width={22} scale={SCALE} key={"crafting-grid" + i}></GUI>
                  <Block blockType={getBlockType(craftingTable.value[i] as EntityIndex)} scale={2.7}></Block>
                </SlotWrapper>
              ))}
            </Grid>

            <SlotWrapper onClick={() => recipeResult != null && handleCraft()}>
              <GUI _x={188} _y={184} _height={22} _width={22} scale={SCALE}></GUI>
              <Block blockType={recipeResult() ?? BlockType.Air} scale={2.7}></Block>
            </SlotWrapper>
          </Wrapper>
        </Center>
      );
    }
  );
}

const SlotWrapper = styled.div`
  position: relative;
`;

const Wrapper = styled.div`
  padding: 10px;
  background-color: lightgray;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  grid-gap: 50px;
  pointer-events: all;
  z-index: 1;
`;

const Background = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  position: absolute;
  height: 100%;
  width: 100%;
  pointer-events: all;
`;

const Grid = styled.div`
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  grid-template-columns: repeat(3, 1fr);
`;

const Slot = styled.div<{ pos: number }>`
  position: absolute;
  left: ${(p) => (p.pos - 1) * SCALE * 20}px;
  top: 0;
`;

const Block = styled(BlockIcon)`
  position: absolute;
  left: 0;
  top: 0;
`;
