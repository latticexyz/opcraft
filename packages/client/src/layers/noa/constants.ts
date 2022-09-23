import { EntityID } from "@latticexyz/recs";
import { BlockTypeKey } from "../network/constants";
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
  RedFlower: "./assets/blocks/16-Red_flower-cccc.png",
  // [MaterialType.OrangeFlower]: "./assets/blocks/50-Orange_flower.png",
  // [MaterialType.MagentaFlower]: "./assets/blocks/51-Magenta_flower.png",
  // [MaterialType.LightBlueFlower]: "./assets/blocks/52-Light_blue_flower.png",
  // [MaterialType.LimeFlower]: "./assets/blocks/53-lime_flower.png",
  // [MaterialType.PinkFlower]: "./assets/blocks/54-pink_flower.png",
  // [MaterialType.GrayFlower]: "./assets/blocks/55-gray_flower.png",
  // [MaterialType.LightGrayFlower]: "./assets/blocks/56-light_gray_flower.png",
  // [MaterialType.CyanFlower]: "./assets/blocks/57-cyan_flower.png",
  // [MaterialType.PurpleFlower]: "./assets/blocks/58-purple_flower.png",
  // [MaterialType.BlueFlower]: "./assets/blocks/59-blue_flower.png",
  // [MaterialType.GreenFlower]: "./assets/blocks/60-green_flower.png",
  // [MaterialType.BlackFlower]: "./assets/blocks/61-black_flower.png",
  Kelp: "./assets/blocks/kelp-small.png",
};

export const UVWraps: { [key in BlockTypeKey]: string | undefined } = {
  Air: undefined,
  Grass: "./assets/uv-wraps/grass.png",
  Dirt: undefined,
  Log: undefined,
  Sand: "./assets/uv-wraps/sand.png",
  Stone: "./assets/uv-wraps/stone.png",
  Water: undefined,
  Cobblestone: "./assets/uv-wraps/cobblestone.png",
  Coal: undefined,
  Crafting: undefined,
  Iron: undefined,
  Gold: undefined,
  Diamond: undefined,
  Leaves: undefined,
  Planks: undefined,
  RedFlower: undefined,
  Kelp: undefined,
};

export const Blocks: { [key in BlockTypeKey]: Block | undefined } = {
  Air: undefined,
  Grass: { type: NoaBlockType.BLOCK, material: [Textures.Grass, Textures.GrassSide] },
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
  Leaves: { type: NoaBlockType.BLOCK, material: Textures.Leaves },
  Planks: { type: NoaBlockType.BLOCK, material: Textures.Planks },

  RedFlower: { type: NoaBlockType.MESH, material: Textures.RedFlower, solid: false, opaque: false },
  Kelp: { type: NoaBlockType.MESH, material: Textures.Kelp, solid: false, opaque: false, frames: 2 },
};

export const Singleton = "Singleton" as EntityID;

export function getBlockIconUrl(blockType: BlockTypeKey) {
  const block = Blocks[blockType];
  if (!block) return "";
  const material = Array.isArray(block.material) ? block.material[0] : block.material;
  return material;
}
