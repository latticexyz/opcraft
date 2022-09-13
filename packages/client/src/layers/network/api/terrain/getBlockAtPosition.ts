import { Component, getComponentValueStrict, Has, HasValue, runQuery, Type } from "@latticexyz/recs";
import { VoxelCoord } from "@latticexyz/utils";
import { BlockType as BlockTypeEnum } from "../../constants";
import { Biome } from "./constants";
import { getBiome } from "./getBiome";
import { getHeight } from "./getHeight";

interface Terrain {
  biome: [number, number, number, number];
  height: number;
}

export function getTerrain(coord: VoxelCoord): Terrain {
  const biome = getBiome(coord);
  const height = getHeight(coord, biome);
  return { biome, height };
}

export function getTerrainBlock({ height, biome }: Terrain, { y }: VoxelCoord): BlockTypeEnum {
  if (y > height) {
    if (y >= 0) return BlockTypeEnum.Air;
    return BlockTypeEnum.Water;
  }

  const maxBiome = Math.max(...biome);
  const maxBiomeIndex = biome.findIndex((x) => x === Math.max(...biome));

  if (maxBiome === 0) return BlockTypeEnum.Dirt;
  if (maxBiomeIndex == Biome.Desert) return BlockTypeEnum.Sand;
  if (maxBiomeIndex == Biome.Mountains) return BlockTypeEnum.Stone;
  if (maxBiomeIndex == Biome.Savanna) return BlockTypeEnum.Grass;
  if (maxBiomeIndex == Biome.Forest) return BlockTypeEnum.Log;
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
  // TODO: first render terrain and then place all user placed blocks in this chunk to avoid delays
  const { Position, BlockType } = context;
  const blocksAtPosition = [...runQuery([HasValue(Position, coord), Has(BlockType)])];

  // // Prefer non-air blocks at this position
  const block =
    blocksAtPosition?.find((b) => getComponentValueStrict(BlockType, b).value !== BlockTypeEnum.Air) ??
    blocksAtPosition[0];
  if (block != null) return getComponentValueStrict(BlockType, block).value;

  // If no user placed block is found return the nature block of this position
  return getTerrainBlock(getTerrain(coord), coord);
}
