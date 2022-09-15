import { euclidean, VoxelCoord } from "@latticexyz/utils";
import { Perlin } from "@latticexyz/noise";
import { Biomes, BiomeVectors } from "./constants";

export function getBiome({ x, z }: VoxelCoord, perlin: Perlin): [number, number, number, number] {
  const heat = perlin(x + 222, z + 222, 0, 444);
  const humidity = perlin(z, x, 999, 333);

  const biomeVector: [number, number] = [humidity, heat];
  const biome = Biomes.map((b) => Math.max((0.75 - euclidean(biomeVector, BiomeVectors[b])) * 2, 0)) as [
    number,
    number,
    number,
    number
  ];

  return biome;
}
