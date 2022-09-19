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
};

console.log("Blocks", BlockType);

export const BlockTypeIndex = Object.values(BlockType).reduce<{ [key: string]: number }>((acc, curr, index) => {
  acc[curr] = index;
  return acc;
}, {});

export const BlockIdToType = Object.entries(BlockType).reduce<{ [key: EntityID]: keyof typeof BlockType }>(
  (acc, [key, value]) => {
    acc[value] = key as keyof typeof BlockType;
    return acc;
  },
  {}
);
