import { EntityID } from "@latticexyz/recs";
import { keccak256 } from "@latticexyz/utils";

export const BlockType = {
  Air: keccak256("block.Air") as EntityID,
  Grass: keccak256("block.Grass") as EntityID,
  Dirt: keccak256("block.Dirt") as EntityID,
  Log: keccak256("block.Log") as EntityID,
  Stone: keccak256("block.Stone") as EntityID,
  Sand: keccak256("block.Sand") as EntityID,
  Water: keccak256("block.Water") as EntityID,
  Cobblestone: keccak256("block.Cobblestone") as EntityID,
  Coal: keccak256("block.Coal") as EntityID,
  Crafting: keccak256("block.Crafting") as EntityID,
  Iron: keccak256("block.Iron") as EntityID,
  Gold: keccak256("block.Gold") as EntityID,
  Diamond: keccak256("block.Diamond") as EntityID,
  Leaves: keccak256("block.Leaves") as EntityID,
  Planks: keccak256("block.Planks") as EntityID,
  RedFlower: keccak256("block.RedFlower") as EntityID,
  Kelp: keccak256("block.Kelp") as EntityID,
};

export type BlockTypeKey = keyof typeof BlockType;

export const BlockIdToIndex = Object.values(BlockType).reduce<{ [key: string]: number }>((acc, id, index) => {
  acc[id] = index;
  return acc;
}, {});

export const BlockIndexToId = Object.values(BlockType).reduce<{ [key: number]: string }>((acc, id, index) => {
  acc[index] = id;
  return acc;
}, {});

export const BlockIndexToKey = Object.entries(BlockType).reduce<{ [key: number]: BlockTypeKey }>(
  (acc, [key], index) => {
    acc[index] = key as BlockTypeKey;
    return acc;
  },
  {}
);

export const BlockIdToKey = Object.entries(BlockType).reduce<{ [key: EntityID]: BlockTypeKey }>((acc, [key, id]) => {
  acc[id] = key as BlockTypeKey;
  return acc;
}, {});
