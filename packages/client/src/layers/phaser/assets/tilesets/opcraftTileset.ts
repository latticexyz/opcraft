import { BlockTypeKey } from "../../../network/constants";
import { gameTiles, heightTiles } from "../../../../tilemap/tiles";

const backgroundTiles: BlockTypeKey[] = [
  "Grass",
  "Dirt",
  "Log",
  "Stone",
  "Sand",
  "Cobblestone",
  "MossyCobblestone",
  "Coal",
  "Crafting",
  "Iron",
  "Gold",
  "Diamond",
  "Planks",
  "Wool",
  "OrangeWool",
  "MagentaWool",
  "LightBlueWool",
  "YellowWool",
  "LimeWool",
  "PinkWool",
  "GrayWool",
  "LightGrayWool",
  "CyanWool",
  "PurpleWool",
  "BlueWool",
  "BrownWool",
  "GreenWool",
  "RedWool",
  "BlackWool",
  "Sponge",
  "Snow",
  "Clay",
  "Bedrock",
  "Bricks",
];

const foregroundTiles: BlockTypeKey[] = [
  "Glass",
  "Water",
  "Leaves",
  "RedFlower",
  "GrassPlant",
  "OrangeFlower",
  "MagentaFlower",
  "LightBlueFlower",
  "LimeFlower",
  "PinkFlower",
  "GrayFlower",
  "LightGrayFlower",
  "CyanFlower",
  "PurpleFlower",
  "BlueFlower",
  "GreenFlower",
  "BlackFlower",
  "Kelp",
];

const tileTypes = Object.keys(gameTiles);
const heightTypes = Object.keys(heightTiles);

export const BackgroundTiles: Partial<Record<BlockTypeKey, number>> = Object.fromEntries(
  backgroundTiles.map((tile) => [tile, tileTypes.indexOf(tile)])
);

export const ForegroundTiles: Partial<Record<BlockTypeKey, number>> = Object.fromEntries(
  foregroundTiles.map((tile) => [tile, tileTypes.indexOf(tile)])
);

export const HeightMapTiles: Partial<Record<number, number>> = Object.fromEntries(
  heightTypes.map((key) => [key, tileTypes.length + heightTypes.indexOf(key)])
);
