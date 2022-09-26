import { Perlin } from "@latticexyz/noise";
import { VoxelCoord } from "@latticexyz/utils";

export interface Terrain {
  biome: [number, number, number, number];
  height: number;
}

export type TerrainState = {
  coord: VoxelCoord;
  biomeVector: [number, number, number, number];
  height: number;
  perlin: Perlin;
  biome?: number;
  coordHash2D?: number;
  coordHash1D?: number;
  chunkHash?: number;
  biomeHash?: number;
  chunkOffset?: VoxelCoord;
  chunkHeight?: number;
  distanceFromHeight?: number;
};
