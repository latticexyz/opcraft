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

export const HeightMapTiles: Partial<Record<number, number>> = {
  "-1": 48,
  "-2": 49,
  "-3": 50,
  "-4": 51,
  "-5": 52,
  "-6": 53,
  "-7": 54,
  "-8": 55,
  "1": 56,
  "2": 57,
  "3": 58,
  "4": 59,
  "5": 60,
  "6": 61,
  "7": 62,
  "8": 63,
};
