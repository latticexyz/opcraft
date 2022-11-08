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
  Heat = "Heat",
  Height = "Height",
  HeightX2 = "HeightX2",
  HeightX4 = "HeightX4",
  HeightX8 = "HeightX8",
  HeightX16 = "HeightX16",
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

export enum ZoomLevel {
  X1,
  X2,
  X4,
  X8,
  X16,
}

export const StepSizePerZoomLevel = {
  [ZoomLevel.X1]: 1,
  [ZoomLevel.X2]: 2,
  [ZoomLevel.X4]: 4,
  [ZoomLevel.X8]: 8,
  [ZoomLevel.X16]: 16,
};

export enum Animations {}

export const UnitTypeSprites: Record<number, Sprites> = {};

export const ItemTypeSprites: Record<number, Sprites> = {};

export const StructureTypeSprites: Record<number, Sprites> = {};
