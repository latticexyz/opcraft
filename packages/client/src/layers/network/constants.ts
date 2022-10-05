import { EntityID } from "@latticexyz/recs";
import { keccak256 } from "@latticexyz/utils";

export const BlockType = {
  Air: keccak256("block.Air") as EntityID,
  Grass: keccak256("block.Grass") as EntityID,
  Dirt: keccak256("block.Dirt") as EntityID,
  Log: keccak256("block.Log") as EntityID,
  Stone: keccak256("block.Stone") as EntityID,
  Sand: keccak256("block.Sand") as EntityID,
  Glass: keccak256("block.Glass") as EntityID,
  Water: keccak256("block.Water") as EntityID,
  Cobblestone: keccak256("block.Cobblestone") as EntityID,
  MossyCobblestone: keccak256("block.MossyCobblestone") as EntityID,
  Coal: keccak256("block.Coal") as EntityID,
  Crafting: keccak256("block.Crafting") as EntityID,
  Iron: keccak256("block.Iron") as EntityID,
  Gold: keccak256("block.Gold") as EntityID,
  Diamond: keccak256("block.Diamond") as EntityID,
  Leaves: keccak256("block.Leaves") as EntityID,
  Planks: keccak256("block.Planks") as EntityID,
  RedFlower: keccak256("block.RedFlower") as EntityID,
  GrassPlant: keccak256("block.GrassPlant") as EntityID,
  OrangeFlower: keccak256("block.OrangeFlower") as EntityID,
  MagentaFlower: keccak256("block.MagentaFlower") as EntityID,
  LightBlueFlower: keccak256("block.LightBlueFlower") as EntityID,
  LimeFlower: keccak256("block.LimeFlower") as EntityID,
  PinkFlower: keccak256("block.PinkFlower") as EntityID,
  GrayFlower: keccak256("block.GrayFlower") as EntityID,
  LightGrayFlower: keccak256("block.LightGrayFlower") as EntityID,
  CyanFlower: keccak256("block.CyanFlower") as EntityID,
  PurpleFlower: keccak256("block.PurpleFlower") as EntityID,
  BlueFlower: keccak256("block.BlueFlower") as EntityID,
  GreenFlower: keccak256("block.GreenFlower") as EntityID,
  BlackFlower: keccak256("block.BlackFlower") as EntityID,
  Kelp: keccak256("block.Kelp") as EntityID,
  Wool: keccak256("block.Wool") as EntityID,
  OrangeWool: keccak256("block.OrangeWool") as EntityID,
  MagentaWool: keccak256("block.MagentaWool") as EntityID,
  LightBlueWool: keccak256("block.LightBlueWool") as EntityID,
  YellowWool: keccak256("block.YellowWool") as EntityID,
  LimeWool: keccak256("block.LimeWool") as EntityID,
  PinkWool: keccak256("block.PinkWool") as EntityID,
  GrayWool: keccak256("block.GrayWool") as EntityID,
  LightGrayWool: keccak256("block.LightGrayWool") as EntityID,
  CyanWool: keccak256("block.CyanWool") as EntityID,
  PurpleWool: keccak256("block.PurpleWool") as EntityID,
  BlueWool: keccak256("block.BlueWool") as EntityID,
  BrownWool: keccak256("block.BrownWool") as EntityID,
  GreenWool: keccak256("block.GreenWool") as EntityID,
  RedWool: keccak256("block.RedWool") as EntityID,
  BlackWool: keccak256("block.BlackWool") as EntityID,
  Sponge: keccak256("block.Sponge") as EntityID,
  Snow: keccak256("block.Snow") as EntityID,
  Clay: keccak256("block.Clay") as EntityID,
  Bedrock: keccak256("block.Bedrock") as EntityID,
  Bricks: keccak256("block.Bricks") as EntityID,
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
