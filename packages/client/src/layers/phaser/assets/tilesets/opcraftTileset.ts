import { BlockType } from "../../../network";

export const BackgroundTiles: Partial<Record<keyof typeof BlockType, number>> = {
  Grass: 1,
  Dirt: 2,
  Sand: 3,
  Stone: 5,
  Coal: 6,
  Snow: 7,
  Wool: 8,
  Diamond: 9,
  Log: 10,
};

export const ForegroundTiles: Partial<Record<keyof typeof BlockType, number>> = {
  Water: 4,
  Leaves: 11,
  GrassPlant: 12,
  Kelp: 13,
};
