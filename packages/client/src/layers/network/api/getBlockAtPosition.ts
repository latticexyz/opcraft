import { Component, getComponentValueStrict, Has, HasValue, runQuery, Type } from "@latticexyz/recs";
import { CoordMap, VoxelCoord } from "@latticexyz/utils";
import { BlockType as BlockTypeEnum } from "../constants";
import { perlin } from "@latticexyz/noise";
import { createSplines } from "@latticexyz/noise/ts/utils";

const perlinMap = new CoordMap<number>();

const continentalSplines = createSplines([
  [0, 0],
  // [0.3, 0.2],
  // [0.5, 0.7],
  [1, 1],
]);

const erosionSplines = createSplines([
  // [0, 1],
  // [0.2, 0.8],
  // [0.4, 0.6],
  // [0.6, 0.5],
  // [0.8, 0.2],
  // [1, 0],
  [0, 0],
  [1, 1],
]);

const peaksAndValleySplines = createSplines([
  [0, 0],
  [1, 1],
]);

function noise({ x, y }: { x: number; y: number }) {
  let perlinValue = 0;

  // Continentalness
  perlinValue += continentalSplines(perlin(x, y, perlinValue, 1000)) * 10;

  // Erosion
  perlinValue += erosionSplines(perlin(x, y, perlinValue, 200)) * 5;

  // Peaks & Valeys
  perlinValue += peaksAndValleySplines(perlin(x, y, perlinValue, 49)) * 1;

  perlinValue /= 16;

  // Interesting island landscape:
  // perlinValue += perlin(x, y, perlinValue, 47 * perlin(y, x, 0, 300) * 100) * 4;
  // perlinValue += perlin(x, y, perlinValue, 99) * 3;
  // perlinValue += perlin(x, y, perlinValue, 49) * 2;
  // perlinValue += perlin(x, y, perlinValue, 13);
  // perlinValue /= 4 + 3 + 2 + 1;

  return Math.floor(perlinValue * 256) - 100;
}

function getHeightAt(coord: VoxelCoord) {
  const flatCoord = { x: coord.x, y: coord.z };
  if (!perlinMap.has(flatCoord)) {
    const height = noise(flatCoord);
    perlinMap.set(flatCoord, height);
    return height;
  } else {
    return perlinMap.get(flatCoord) || 0;
  }
}

export function getTerrainAtPosition(coord: VoxelCoord) {
  const height = getHeightAt(coord);

  if (coord.y < height) {
    if (coord.y < 5) return BlockTypeEnum.Sand;
    return BlockTypeEnum.Grass;
  }

  if (coord.y < -10) {
    return BlockTypeEnum.Water;
  }

  return BlockTypeEnum.Air;
}

export function getBlockAtPosition(
  context: {
    Position: Component<{ x: Type.Number; y: Type.Number; z: Type.Number }>;
    BlockType: Component<{ value: Type.Number }>;
  },
  coord: VoxelCoord
) {
  // First check for user placed block
  const { Position, BlockType } = context;
  const blocksAtPosition = [...runQuery([HasValue(Position, coord), Has(BlockType)])];

  // Prefer non-air blocks at this position
  const block =
    blocksAtPosition?.find((b) => getComponentValueStrict(BlockType, b).value !== BlockTypeEnum.Air) ??
    blocksAtPosition[0];
  if (block != null) return getComponentValueStrict(BlockType, block).value;

  // If no user placed block is found return the nature block of this position
  return getTerrainAtPosition(coord);
}
