import { Component, getComponentValueStrict, Has, HasValue, runQuery, Type } from "@latticexyz/recs";
import { CoordMap, cubicNoiseConfig, cubicNoiseSample2, VoxelCoord } from "@latticexyz/utils";
import { BlockType as BlockTypeEnum } from "../constants";

const perlinMap = new CoordMap<number>();

function noise(coord: { x: number; y: number }) {
  return Math.floor(cubicNoiseSample2(cubicNoiseConfig(1000, 64, 16, 256, 256), coord.x, coord.y) - 8);
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

export function getBlockAtPosition(
  context: {
    Position: Component<{ x: Type.Number; y: Type.Number; z: Type.Number }>;
    BlockType: Component<{ value: Type.Number }>;
  },
  coord: VoxelCoord
) {
  // First check for user placed block
  const { Position, BlockType } = context;
  const block = [...runQuery([HasValue(Position, coord), Has(BlockType)])][0];
  if (block != null) return getComponentValueStrict(BlockType, block).value;

  // If no user placed block is found return the nature block of this position
  const height = getHeightAt(coord);

  if (coord.y < height) {
    if (coord.y < 1) return BlockTypeEnum.Sand;
    return BlockTypeEnum.Grass;
  }

  if (coord.y < 0) {
    return BlockTypeEnum.Water;
  }

  return BlockTypeEnum.Air;
}
