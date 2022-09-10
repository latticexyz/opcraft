import { Component, getComponentValueStrict, Has, HasValue, runQuery, Type } from "@latticexyz/recs";
import { CoordMap, VoxelCoord } from "@latticexyz/utils";
import { BlockType as BlockTypeEnum } from "../constants";
import { perlin } from "@latticexyz/noise";
import { createSplines } from "@latticexyz/noise/ts/utils";

const heightMap = new CoordMap<number>();

enum Biome {
  Mountains,
  Desert,
  Savanna,
  Forest,
}

const Biomes: [Biome, Biome, Biome, Biome] = [Biome.Mountains, Biome.Desert, Biome.Savanna, Biome.Forest];

interface Terrain {
  biome: [number, number, number, number];
  height: number;
}

// [humidity, heat]
const BiomeVectors: { [key in Biome]: [number, number] } = {
  [Biome.Mountains]: [0, 0],
  [Biome.Desert]: [0, 1],
  [Biome.Forest]: [1, 0],
  [Biome.Savanna]: [1, 1],
};

const mountains = createSplines([
  [0, 0],
  [0.3, 0.2],
  [0.6, 2],
  [1, 3],
]);

const desert = createSplines([
  [0, 0],
  [1, 0],
]);

const forest = createSplines([
  [0, 0],
  [1, 0],
]);

const savanna = createSplines([
  [0, 0],
  [1, 0],
]);

function getHeight({ x, z }: VoxelCoord, biome: [number, number, number, number]): number {
  // Check cache
  const flatCoord = { x, y: z };
  const cacheHeight = heightMap.get(flatCoord);
  if (cacheHeight != null) return cacheHeight;

  // Compute height

  const continentalness = perlin(x, z, 0, 999);
  const erosion = perlin(x, z, 0, 49);
  let biomeErosion = 0;
  biomeErosion += biome[Biome.Mountains] * mountains(erosion);
  biomeErosion += biome[Biome.Desert] * desert(erosion);
  biomeErosion += biome[Biome.Forest] * forest(erosion);
  biomeErosion += biome[Biome.Savanna] * savanna(erosion);
  biomeErosion /= biome.reduce((acc, curr) => acc + curr, 1);

  let height = (continentalness * 2 + biomeErosion) / 3;

  height *= 128;
  height -= 128;

  // Set cache
  heightMap.set(flatCoord, height);
  return height;
}

function distance(a: [number, number], b: [number, number]): number {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function getBiome({ x, z }: VoxelCoord): [number, number, number, number] {
  const heat = perlin(x + 222, z + 222, 0, 444);
  const humidity = perlin(z, x, 999, 333);

  const biomeVector: [number, number] = [humidity, heat];
  const biome = Biomes.map((b) => Math.max((0.75 - distance(biomeVector, BiomeVectors[b])) * 2, 0)) as [
    number,
    number,
    number,
    number
  ];

  return biome;
}

function getTerrain(coord: VoxelCoord): Terrain {
  const biome = getBiome(coord);
  const height = getHeight(coord, biome);
  return { biome, height };
}

function getTerrainBlock({ height, biome }: Terrain, { y }: VoxelCoord): BlockTypeEnum {
  if (y > height) {
    if (y >= 0) return BlockTypeEnum.Air;
    return BlockTypeEnum.Air;
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
  // const { Position, BlockType } = context;
  // const blocksAtPosition = [...runQuery([HasValue(Position, coord), Has(BlockType)])];

  // // // Prefer non-air blocks at this position
  // const block =
  //   blocksAtPosition?.find((b) => getComponentValueStrict(BlockType, b).value !== BlockTypeEnum.Air) ??
  //   blocksAtPosition[0];
  // if (block != null) return getComponentValueStrict(BlockType, block).value;

  // If no user placed block is found return the nature block of this position

  return getTerrainBlock(getTerrain(coord), coord);
}
