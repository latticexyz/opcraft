import { Component, EntityID, getComponentValue, getEntitiesWithValue, Type, World } from "@latticexyz/recs";
import { CoordMap, VoxelCoord } from "@latticexyz/utils";
import { Perlin } from "@latticexyz/noise";
import { BlockType } from "../../constants";
import { Biome } from "./constants";
import { getBiome } from "./getBiome";
import { getHeight } from "./getHeight";
import { keccak256Coord } from "@latticexyz/utils";
import { BigNumber } from "ethers";

interface Terrain {
  biome: [number, number, number, number];
  height: number;
}

const hashCache = new CoordMap<number>();

function getCoordHash(coord: VoxelCoord) {
  const flatCoord = { x: coord.x, y: coord.z };
  const cacheHash = hashCache.get(flatCoord);
  if (cacheHash != null) return cacheHash;

  // TODO: make this faster by using keccak-wasm
  const hash = BigNumber.from(keccak256Coord(flatCoord)).mod(1024).toNumber() / 1024;

  hashCache.set(flatCoord, hash);
  return hash;
}

export function getTerrain(coord: VoxelCoord, perlin: Perlin): Terrain {
  const biome = getBiome(coord, perlin);
  const height = getHeight(coord, biome, perlin);
  return { biome, height };
}

export function getTerrainBlock({ height, biome }: Terrain, coord: VoxelCoord): EntityID {
  const { y } = coord;

  if (y > height + 1) {
    if (y >= 0) return BlockType.Air;
    return BlockType.Water;
  }

  const maxBiome = Math.max(...biome);
  const maxBiomeIndex = biome.findIndex((x) => x === Math.max(...biome));

  if (maxBiome === 0) return BlockType.Dirt;

  if (maxBiomeIndex == Biome.Desert) {
    if (y === height + 1) {
      const hash = getCoordHash(coord);
      if (hash > 0.99) return BlockType.Kelp;
      return BlockType.Air;
    }
    return BlockType.Sand;
  }

  if (maxBiomeIndex == Biome.Mountains) return BlockType.Stone;
  if (maxBiomeIndex == Biome.Savanna) {
    if (y === height + 1) {
      const hash = getCoordHash(coord);
      if (hash < 0.02) return BlockType.RedFlower;
      return BlockType.Air;
    }
    return BlockType.Grass;
  }
  if (maxBiomeIndex == Biome.Forest) return BlockType.Grass;
  return BlockType.Air;
}

export function getECSBlock(
  context: {
    Position: Component<{ x: Type.Number; y: Type.Number; z: Type.Number }>;
    Item: Component<{ value: Type.String }>;
    world: World;
  },
  coord: VoxelCoord
): EntityID | undefined {
  const { Position, Item } = context;
  const entitiesAtPosition = [...getEntitiesWithValue(Position, coord)];

  const entityAtPosition =
    // Prefer non-air blocks at this position
    entitiesAtPosition?.find((b) => {
      const item = getComponentValue(Item, b);
      return item && item.value !== BlockType.Air;
    }) ?? entitiesAtPosition[0];

  if (entitiesAtPosition == null) return undefined;

  return getComponentValue(Item, entityAtPosition)?.value as EntityID;
}

export function getBlockAtPosition(
  context: {
    Position: Component<{ x: Type.Number; y: Type.Number; z: Type.Number }>;
    Item: Component<{ value: Type.String }>;
    world: World;
  },
  perlin: Perlin,
  coord: VoxelCoord
) {
  return getECSBlock(context, coord) ?? getTerrainBlock(getTerrain(coord, perlin), coord);
}
