import { EntityID } from "@latticexyz/recs";
import { BlockType } from "../network";
import { Block, NoaBlockType } from "./types";

export const Textures = {
  Grass: "./assets/blocks/4-Grass_block-top.png",
  GrassSide: "./assets/blocks/4-Grass_block-side.png",
  GrassBottom: "./assets/blocks/4-Grass_block-bottom.png",
  Dirt: "./assets/blocks/3-Dirt.png",
  Log: "./assets/blocks/47-Log-1-sides.png",
  LogTop: "./assets/blocks/47-Log-0-top.png",
  Sand: "./assets/blocks/07-Sand.png",
  Stone: "./assets/blocks/48-Stone.png",
  Water: "./assets/blocks/10-Water.png",
  TransparentWater: "./assets/blocks/10-Water.png",
  Cobblestone: "./assets/blocks/1-Cobblestone.png",
  Coal: "./assets/blocks/39-Coal_Ore.png",
  Iron: "./assets/blocks/38-Iron_Ore.png",
  Gold: "./assets/blocks/40-Gold_Ore.png",
  Diamond: "./assets/blocks/49-Diamond_ore.png",
  Leaves: "./assets/blocks/06-Leaves.png",
  Planks: "./assets/blocks/05-Wood_plank.png",
  Crafting: "./assets/blocks/46-Crafting_Table-0-top.png",
  CraftingSide: "./assets/blocks/46-Crafting_Table-1-sides.png",
  CraftingBottom: "./assets/blocks/46-Crafting_Table-2-bottom.png",
  Wool: "./assets/blocks/22-White_Wool.png",
  Snow: "./assets/blocks/62-Snow_on_grass-0-top.png",
  Cray: "./assets/blocks/64-Cray.png",
  RedFlower: "./assets/blocks/16-Red_flower-cccc.png",
  OrangeFlower: "./assets/blocks/50-Orange_flower.png",
  MagentaFlower: "./assets/blocks/51-Magenta_flower.png",
  LightBlueFlower: "./assets/blocks/52-Light_blue_flower.png",
  LimeFlower: "./assets/blocks/53-lime_flower.png",
  PinkFlower: "./assets/blocks/54-pink_flower.png",
  GrayFlower: "./assets/blocks/55-gray_flower.png",
  LightGrayFlower: "./assets/blocks/56-light_gray_flower.png",
  CyanFlower: "./assets/blocks/57-cyan_flower.png",
  PurpleFlower: "./assets/blocks/58-purple_flower.png",
  BlueFlower: "./assets/blocks/59-blue_flower.png",
  GreenFlower: "./assets/blocks/60-green_flower.png",
  BlackFlower: "./assets/blocks/61-black_flower.png",
  GrassPlant: "./assets/blocks/grass.png",
  Kelp: "./assets/blocks/kelp-small.png",
  Bedrock: "./assets/blocks/44-Obsidian.png",
};

export const Blocks: { [key in keyof typeof BlockType]: Block | undefined } = {
  Air: undefined,
  Grass: { type: NoaBlockType.BLOCK, material: [Textures.Grass, Textures.Dirt, Textures.GrassSide] },
  Dirt: { type: NoaBlockType.BLOCK, material: Textures.Dirt },
  Log: { type: NoaBlockType.BLOCK, material: [Textures.LogTop, Textures.Log] },
  Sand: { type: NoaBlockType.BLOCK, material: Textures.Sand },
  Stone: { type: NoaBlockType.BLOCK, material: Textures.Stone },
  Water: {
    type: NoaBlockType.BLOCK,
    material: [Textures.Water, Textures.TransparentWater, Textures.TransparentWater],
    opaque: false,
    fluid: true,
    solid: false,
  },
  Cobblestone: { type: NoaBlockType.BLOCK, material: Textures.Cobblestone },
  Coal: { type: NoaBlockType.BLOCK, material: Textures.Coal },
  Crafting: {
    type: NoaBlockType.BLOCK,
    material: [Textures.Crafting, Textures.CraftingBottom, Textures.CraftingSide],
  },
  Iron: { type: NoaBlockType.BLOCK, material: Textures.Iron },
  Gold: { type: NoaBlockType.BLOCK, material: Textures.Gold },
  Diamond: { type: NoaBlockType.BLOCK, material: Textures.Diamond },
  Leaves: { type: NoaBlockType.BLOCK, material: Textures.Leaves, opaque: true },
  Planks: { type: NoaBlockType.BLOCK, material: Textures.Planks },
  Wool: { type: NoaBlockType.BLOCK, material: Textures.Wool },
  Snow: { type: NoaBlockType.BLOCK, material: Textures.Snow },
  Clay: { type: NoaBlockType.BLOCK, material: Textures.Cray },
  Bedrock: { type: NoaBlockType.BLOCK, material: Textures.Bedrock },
  RedFlower: { type: NoaBlockType.MESH, material: Textures.RedFlower, solid: false, opaque: false },
  OrangeFlower: { type: NoaBlockType.MESH, material: Textures.OrangeFlower, solid: false, opaque: false },
  MagentaFlower: { type: NoaBlockType.MESH, material: Textures.MagentaFlower, solid: false, opaque: false },
  LightBlueFlower: { type: NoaBlockType.MESH, material: Textures.LightBlueFlower, solid: false, opaque: false },
  LimeFlower: { type: NoaBlockType.MESH, material: Textures.LimeFlower, solid: false, opaque: false },
  PinkFlower: { type: NoaBlockType.MESH, material: Textures.PinkFlower, solid: false, opaque: false },
  GrayFlower: { type: NoaBlockType.MESH, material: Textures.GrayFlower, solid: false, opaque: false },
  LightGrayFlower: { type: NoaBlockType.MESH, material: Textures.LightGrayFlower, solid: false, opaque: false },
  CyanFlower: { type: NoaBlockType.MESH, material: Textures.CyanFlower, solid: false, opaque: false },
  PurpleFlower: { type: NoaBlockType.MESH, material: Textures.PurpleFlower, solid: false, opaque: false },
  BlueFlower: { type: NoaBlockType.MESH, material: Textures.BlueFlower, solid: false, opaque: false },
  GreenFlower: { type: NoaBlockType.MESH, material: Textures.GreenFlower, solid: false, opaque: false },
  BlackFlower: { type: NoaBlockType.MESH, material: Textures.BlackFlower, solid: false, opaque: false },
  Kelp: { type: NoaBlockType.MESH, material: Textures.Kelp, solid: false, opaque: false, frames: 2 },
  GrassPlant: { type: NoaBlockType.MESH, material: Textures.GrassPlant, solid: false, opaque: false },
};

export const Singleton = "Singleton" as EntityID;

export function getBlockIconUrl(blockType: keyof typeof BlockType) {
  const block = Blocks[blockType];
  if (!block) return "";
  const material = Array.isArray(block.material) ? block.material[0] : block.material;
  return material;
}
