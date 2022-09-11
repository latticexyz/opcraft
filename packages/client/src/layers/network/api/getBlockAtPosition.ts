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

const continentalness = createSplines([
  [0, 0],
  [0.3, 0],
  [0.4, 0.7],
  [0.6, 1],
  [1, 1],
]);

const mountains = createSplines([
  [0, 0],
  [0.3, 0.2],
  [0.6, 1],
  [1, 2],
]);

const desert = createSplines([
  [0, 0],
  [1, 0.2],
]);

const forest = createSplines([
  [0, 0],
  [1, 0.5],
]);

const savanna = createSplines([
  [0, 0],
  [1, 0.2],
]);

const valleys = createSplines([
  [0.4, 1],
  [0.45, 0.9],
  [0.48, 0.8],
  [0.499, 0.7],
  [0.501, 0.7],
  [0.51, 0.8],
  [0.55, 0.9],
  [0.6, 1],
  [1, 1],
]);

function getHeight({ x, z }: VoxelCoord, biome: [number, number, number, number]): number {
  // Check cache
  const flatCoord = { x, y: z };
  const cacheHeight = heightMap.get(flatCoord);
  if (cacheHeight != null) return cacheHeight;

  // Compute perlin height
  const continentalHeight = continentalness(perlin(x, z, 0, 999)); // * 10;
  let terrainHeight = perlin(x, z, 0, 777) * 10;
  terrainHeight += perlin(x, z, 0, 49) * 5;
  terrainHeight += perlin(x, z, 0, 13);
  terrainHeight /= 16;
  //
  // Create valleys
  // const valley = valleys(perlin(x, z, 0, 444));
  // terrainHeight *= valley;

  // Center height around 0

  // Compute biome height
  let height = 0;
  height += biome[Biome.Mountains] * mountains(terrainHeight);
  height += biome[Biome.Desert] * desert(terrainHeight);
  height += biome[Biome.Forest] * forest(terrainHeight);
  height += biome[Biome.Savanna] * savanna(terrainHeight);
  height /= biome.reduce((acc, curr) => acc + curr, 1);

  // Scale height
  height *= 256;
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
