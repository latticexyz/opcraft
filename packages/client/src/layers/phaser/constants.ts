export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 32;

export enum Scenes {
  Main = "Main",
}

export enum Maps {
  Main = "Main",
  X2 = "X2",
  X4 = "X4",
  X8 = "X8",
  X16 = "X16",
}

export enum Assets {
  OverworldTileset = "OverworldTileset",
  // MountainTileset = "MountainTileset",
  // MainAtlas = "MainAtlas",
  OPCraftTileset = "OPCraftTileset",
}

export enum Sprites {
  Hero,
  Settlement,
  Gold,
  Inventory,
  GoldShrine,
  EmberCrown,
  EscapePortal,
  Donkey,
}

export enum Animations {}

export const UnitTypeSprites: Record<number, Sprites> = {};

export const ItemTypeSprites: Record<number, Sprites> = {};

export const StructureTypeSprites: Record<number, Sprites> = {};
