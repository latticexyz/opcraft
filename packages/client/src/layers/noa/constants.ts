import { EntityID } from "@latticexyz/recs";
import { BlockType } from "../network";
import { Block } from "./types";

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
  Cobblestone = "Cobblestone",
  Coal = "Coal",
  Iron = "Iron",
  Gold = "Gold",
  Diamond = "Diamond",
  Leaves = "Leaves",
  Planks = "Planks",
  Crafting = "Crafting",
  CraftingSide = "CraftingSide",
}

export const Textures = {
  [MaterialType.Grass]: "./assets/blocks/4-Grass_block-top.png",
  [MaterialType.GrassSide]: "./assets/blocks/4-Grass_block-side.png",
  [MaterialType.GrassBottom]: "./assets/blocks/4-Grass_block-bottom.png",
  [MaterialType.Dirt]: "./assets/blocks/3-Dirt.png",
  [MaterialType.Log]: "./assets/blocks/log_oak.png",
  [MaterialType.LogTop]: "./assets/blocks/log_oak_top.png",
  [MaterialType.Sand]: "./assets/blocks/07-Sand.png",
  [MaterialType.Stone]: "./assets/blocks/stone.png",
  [MaterialType.Water]: "./assets/blocks/10-Water.png",
  [MaterialType.Cobblestone]: "./assets/blocks/1-Cobblestone.png",
  [MaterialType.Coal]: "./assets/blocks/coal_ore.png",
  [MaterialType.Iron]: "./assets/blocks/iron_ore.png",
  [MaterialType.Gold]: "./assets/blocks/gold_ore.png",
  [MaterialType.Diamond]: "./assets/blocks/diamond_ore.png",
  [MaterialType.Leaves]: "./assets/blocks/leaves_oak_carried.png",
  [MaterialType.Planks]: "./assets/blocks/2-Bricks.png",
  [MaterialType.Crafting]: "./assets/blocks/crafting_table_top.png",
  [MaterialType.CraftingSide]: "./assets/blocks/crafting_table_front.png",
};

export const Blocks: { [key in BlockType]: Block | undefined } = {
  [BlockType.Air]: undefined,
  [BlockType.Grass]: { material: [MaterialType.Grass, MaterialType.GrassSide] },
  [BlockType.Dirt]: { material: MaterialType.Dirt },
  [BlockType.Log]: { material: [MaterialType.LogTop, MaterialType.Log] },
  [BlockType.Sand]: { material: MaterialType.Sand },
  [BlockType.Stone]: { material: MaterialType.Stone },
  [BlockType.Water]: { material: MaterialType.Water },
  [BlockType.Cobblestone]: { material: MaterialType.Cobblestone },
  [BlockType.Coal]: { material: MaterialType.Coal },
  [BlockType.Crafting]: { material: [MaterialType.Crafting, MaterialType.CraftingSide] },
  [BlockType.Iron]: { material: MaterialType.Iron },
  [BlockType.Gold]: { material: MaterialType.Gold },
  [BlockType.Diamond]: { material: MaterialType.Diamond },
  [BlockType.Leaves]: { material: MaterialType.Leaves },
  [BlockType.Planks]: { material: MaterialType.Planks },
};

export const Singleton = "Singleton" as EntityID;

export function getBlockIconUrl(blockType: BlockType) {
  const block = Blocks[blockType];
  if (!block) return "";
  const material = Array.isArray(block.material) ? block.material[0] : block.material;
  return Textures[material as MaterialType];
}
