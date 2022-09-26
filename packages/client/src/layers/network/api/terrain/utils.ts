import { Perlin } from "@latticexyz/noise";
import { CoordMap, keccak256Coord, VoxelCoord } from "@latticexyz/utils";
import { BigNumber } from "ethers";
import { Biome, STRUCTURE_CHUNK, STRUCTURE_CHUNK_CENTER } from "./constants";
import { getBiome } from "./getBiome";
import { getHeight } from "./getHeight";
import { Terrain, TerrainState } from "./types";

const hashCache = new CoordMap<number>();

export function getCoordHash(x: number, y = 0) {
  const coord = { x, y };
  const cacheHash = hashCache.get(coord);
  if (cacheHash != null) return cacheHash;

  const hash = BigNumber.from(keccak256Coord(coord)).mod(1024).toNumber();

  hashCache.set(coord, hash);
  return hash;
}

export function getChunkHash(coord: VoxelCoord) {
  const { x, z } = getChunkCoord(coord);
  return getCoordHash(x, z);
}

export function getBiomeHash(coord: VoxelCoord, biome: Biome) {
  return getCoordHash(Math.floor(coord.x / 300) + Math.floor(coord.z / 300), biome);
}

function getChunkCoord({ x, z }: VoxelCoord) {
  const chunkCoord = {
    x: Math.floor(x / STRUCTURE_CHUNK),
    y: 0,
    z: Math.floor(z / STRUCTURE_CHUNK),
  };
  return chunkCoord;
}

export function getTerrain(coord: VoxelCoord, perlin: Perlin): Terrain {
  const biome = getBiome(coord, perlin);
  const height = getHeight(coord, biome, perlin);
  return { biome, height };
}

function getChunkOffsetAndHeight(coord: VoxelCoord, perlin: Perlin): { offset: VoxelCoord; height: number } {
  const chunkCoord = getChunkCoord(coord);

  const centerCoord = {
    x: chunkCoord.x * STRUCTURE_CHUNK + STRUCTURE_CHUNK_CENTER,
    y: 0,
    z: chunkCoord.z * STRUCTURE_CHUNK + STRUCTURE_CHUNK_CENTER,
  };

  const { height } = getTerrain(centerCoord, perlin);

  const offset = {
    x: coord.x - chunkCoord.x * STRUCTURE_CHUNK,
    y: coord.y - height,
    z: coord.z - chunkCoord.z * STRUCTURE_CHUNK,
  };
  return { height, offset };
}

export function accessState<K extends keyof TerrainState>(state: TerrainState, prop: K): NonNullable<TerrainState[K]> {
  let value = state[prop];
  if (value != null) return value;
  const { coord, biomeVector, height, perlin } = state;

  if (prop === "biome") {
    state.biome = biomeVector.findIndex((x) => x === Math.max(...biomeVector));
  }

  if (prop === "coordHash2D") {
    state.coordHash2D = getCoordHash(coord.x, coord.z);
  }

  if (prop === "coordHash1D") {
    state.coordHash1D = getCoordHash(coord.y, coord.x + coord.z);
  }

  if (prop === "chunkHash") {
    state.chunkHash = getChunkHash(coord);
  }

  if (prop === "biomeHash") {
    state.biomeHash = getBiomeHash(coord, accessState(state, "biome"));
  }

  if (prop === "chunkOffset" || prop === "chunkHeight") {
    const { height, offset } = getChunkOffsetAndHeight(coord, perlin);
    state.chunkHeight = height;
    state.chunkOffset = offset;
  }

  if (prop === "distanceFromHeight") {
    state.distanceFromHeight = height - coord.y;
  }

  value = state[prop];
  if (value == null) throw new Error("Can not find prop " + prop);
  return value;
}
