import { Perlin, createSplines } from "@latticexyz/noise";
import { CoordMap, roundTowardsZero, VoxelCoord } from "@latticexyz/utils";
import { Biome } from "./constants";

const heightMap = new CoordMap<number>();

export const continentalness = createSplines([
  [0, 0],
  [0.5, 0.5],
  [1, 0.5],
]);

export const mountains = createSplines([
  [0, 0],
  [0.3, 0.4],
  [0.6, 2],
  [1, 4],
]);

export const desert = createSplines([
  [0, 0],
  [1, 0.4],
]);

export const forest = createSplines([
  [0, 0],
  [1, 0.5],
]);

export const savanna = createSplines([
  [0, 0],
  [1, 0.4],
]);

export const valleys = createSplines([
  [0, 1],
  [0.45, 1],
  [0.49, 0.9],
  [0.499, 0.8],
  [0.501, 0.8],
  [0.51, 0.9],
  [0.55, 1],
  [1, 1],
]);

export function getHeight({ x, z }: VoxelCoord, biome: [number, number, number, number], perlin: Perlin): number {
  // Check cache
  const flatCoord = { x, y: z };
  const cacheHeight = heightMap.get(flatCoord);
  if (cacheHeight != null) return cacheHeight;

  // Compute perlin height
  const perlin999 = perlin(x - 550, z + 550, 0, 999);
  const continentalHeight = continentalness(perlin999);
  let terrainHeight = perlin999 * 10;
  const perlin49 = perlin(x, z, 0, 49);
  terrainHeight += perlin49 * 5;
  terrainHeight += perlin(x, z, 0, 13);
  terrainHeight /= 16;

  // Compute biome height
  let height = biome[Biome.Mountains] * mountains(terrainHeight);
  height += biome[Biome.Desert] * desert(terrainHeight);
  height += biome[Biome.Forest] * forest(terrainHeight);
  height += biome[Biome.Savanna] * savanna(terrainHeight);
  height /= biome.reduce((acc, curr) => acc + curr, 1);

  height = continentalHeight + height / 2;

  // Create valleys
  const valley = valleys((perlin(x, z, 0, 333) * 2 + perlin49) / 3);
  height *= valley;

  // Scale height
  height *= 256;
  height = roundTowardsZero(height);
  height -= 128;

  // Set cache
  heightMap.set(flatCoord, height);
  return height;
}
