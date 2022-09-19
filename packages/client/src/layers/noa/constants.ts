import { EntityID } from "@latticexyz/recs";
import { BlockType } from "../network";
import { Block, NoaBlockType } from "./types";

export enum MaterialType {
  Grass = "Grass",
  GrassSide = "GrassSide",
  GrassBottom = "GrassBottom",
  Dirt = "Dirt",
  Log = "Log",
  LogTop = "LogTop",
  Sand = "Sand",
  Stone = "Stone",
  Water = "Water",
  TransparentWater = "TransparentWater",
  Cobblestone = "Cobblestone",
  Coal = "Coal",
  Iron = "Iron",
  Gold = "Gold",
  Diamond = "Diamond",
  Leaves = "Leaves",
  Planks = "Planks",
  Crafting = "Crafting",
  CraftingSide = "CraftingSide",
  CraftingBottom = "CraftingBottom",
  RedFlower = "RedFlower",
  Kelp = "Kelp",
}

export const Textures = {
  [MaterialType.Grass]: "./assets/blocks/4-Grass_block-top.png",
  [MaterialType.GrassSide]: "./assets/blocks/4-Grass_block-side.png",
  [MaterialType.GrassBottom]: "./assets/blocks/4-Grass_block-bottom.png",
  [MaterialType.Dirt]: "./assets/blocks/3-Dirt.png",
  [MaterialType.Log]: "./assets/blocks/47-Log-1-sides.png",
  [MaterialType.LogTop]: "./assets/blocks/47-Log-0-top.png",
  [MaterialType.Sand]: "./assets/blocks/07-Sand.png",
  [MaterialType.Stone]: "./assets/blocks/48-Stone.png",
  [MaterialType.Water]: "./assets/blocks/10-Water.png",
  [MaterialType.TransparentWater]: "./assets/blocks/10-Water.png",
  [MaterialType.Cobblestone]: "./assets/blocks/1-Cobblestone.png",
  [MaterialType.Coal]: "./assets/blocks/39-Coal_Ore.png",
  [MaterialType.Iron]: "./assets/blocks/38-Iron_Ore.png",
  [MaterialType.Gold]: "./assets/blocks/40-Gold_Ore.png",
  [MaterialType.Diamond]: "./assets/blocks/49-Diamond_ore.png",
  [MaterialType.Leaves]: "./assets/blocks/06-Leaves.png",
  [MaterialType.Planks]: "./assets/blocks/05-Wood_plank.png",
  [MaterialType.Crafting]: "./assets/blocks/46-Crafting_Table-0-top.png",
  [MaterialType.CraftingSide]: "./assets/blocks/46-Crafting_Table-1-sides.png",
  [MaterialType.CraftingBottom]: "./assets/blocks/46-Crafting_Table-2-bottom.png",
  [MaterialType.RedFlower]: "./assets/blocks/red_flower.png",
  [MaterialType.Kelp]: "./assets/blocks/kelp-small.png",
};

export const Blocks: { [key in keyof typeof BlockType]: Block | undefined } = {
  Air: undefined,
  Grass: { type: NoaBlockType.BLOCK, material: [MaterialType.Grass, MaterialType.GrassSide] },
  Dirt: { type: NoaBlockType.BLOCK, material: MaterialType.Dirt },
  Log: { type: NoaBlockType.BLOCK, material: [MaterialType.LogTop, MaterialType.Log] },
  Sand: { type: NoaBlockType.BLOCK, material: MaterialType.Sand },
  Stone: { type: NoaBlockType.BLOCK, material: MaterialType.Stone },
  Water: {
    type: NoaBlockType.BLOCK,
    material: [MaterialType.Water, MaterialType.TransparentWater, MaterialType.TransparentWater],
    opaque: false,
    fluid: true,
    solid: false,
  },
  Cobblestone: { type: NoaBlockType.BLOCK, material: MaterialType.Cobblestone },
  Coal: { type: NoaBlockType.BLOCK, material: MaterialType.Coal },
  Crafting: {
    type: NoaBlockType.BLOCK,
    material: [MaterialType.Crafting, MaterialType.CraftingBottom, MaterialType.CraftingSide],
  },
  Iron: { type: NoaBlockType.BLOCK, material: MaterialType.Iron },
  Gold: { type: NoaBlockType.BLOCK, material: MaterialType.Gold },
  Diamond: { type: NoaBlockType.BLOCK, material: MaterialType.Diamond },
  Leaves: { type: NoaBlockType.BLOCK, material: MaterialType.Leaves },
  Planks: { type: NoaBlockType.BLOCK, material: MaterialType.Planks },

  RedFlower: { type: NoaBlockType.MESH, material: MaterialType.RedFlower, solid: false, opaque: false },
  Kelp: { type: NoaBlockType.MESH, material: MaterialType.Kelp, solid: false, opaque: false, frames: 2 },
};

export const Singleton = "Singleton" as EntityID;

export function getBlockIconUrl(blockType: keyof typeof BlockType) {
  const block = Blocks[blockType];
  if (!block) return "";
  const material = Array.isArray(block.material) ? block.material[0] : block.material;
  return Textures[material as MaterialType];
}
