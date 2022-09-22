import { Component, EntityID, getComponentValue, getEntitiesWithValue, Type, World } from "@latticexyz/recs";
import { CoordMap, VoxelCoord } from "@latticexyz/utils";
import { Perlin } from "@latticexyz/noise";
import { BlockType } from "../../constants";
import { Biome } from "./constants";
import { getBiome } from "./getBiome";
import { getHeight } from "./getHeight";
import { keccak256Coord } from "@latticexyz/utils";
import { BigNumber } from "ethers";
import { getStructureBlock, STRUCTURE_CHUNK, tree, woolTree } from "./structures";

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

function getChunkCoord({ x, z }: VoxelCoord) {
  return {
    x: Math.floor(x / STRUCTURE_CHUNK),
    y: 0,
    z: Math.floor(z / STRUCTURE_CHUNK),
  };
}

function getChunkHash(coord: VoxelCoord) {
  return getCoordHash(getChunkCoord(coord));
}

function getChunkOffsetAndHeight(
  coord: VoxelCoord,
  biome: [number, number, number, number],
  perlin: Perlin
): { offset: VoxelCoord; height: number } {
  const center = Math.floor(STRUCTURE_CHUNK / 2) + 1;
  const chunkCoord = getChunkCoord(coord);

  const centerCoord = {
    x: chunkCoord.x * STRUCTURE_CHUNK + center,
    y: 0,
    z: chunkCoord.z * STRUCTURE_CHUNK + center,
  };
  const height = getHeight(centerCoord, biome, perlin);

  const offset = {
    x: coord.x - chunkCoord.x * STRUCTURE_CHUNK,
    y: coord.y - height,
    z: coord.z - chunkCoord.z * STRUCTURE_CHUNK,
  };
  return { height, offset };
}

export function getTerrainBlock({ height, biome }: Terrain, coord: VoxelCoord, perlin: Perlin): EntityID {
  const { y } = coord;

  // Everything below 0 and above the height is water (= no vegetation under water)
  if (y < 0 && y >= height) return BlockType.Water;

  // The highest structures are 4 blocks above the height, so everythign above that is air
  // but because chunks are spanned over uneven terrain, add another chunk of padding above
  if (y >= height + 2 * STRUCTURE_CHUNK) return BlockType.Air;

  const maxBiomeIndex = biome.findIndex((x) => x === Math.max(...biome));
  // const hash = getCoordHash(coord);

  // Terrain
  if (y < -255) return BlockType.Bedrock;

  const hash = getCoordHash(coord);

  if (y < height) {
    if (maxBiomeIndex === Biome.Savanna) {
      if (y < -20) {
        if (hash < 0.005) return BlockType.Diamond;
        return BlockType.Stone;
      }
      if (y < 2) {
        if (height - y <= 4) return BlockType.Sand;
        if (height - y <= 6) return BlockType.Cray;
      }
      if (y === height - 1) return BlockType.Grass;
      return BlockType.Dirt;
    }
    if (maxBiomeIndex === Biome.Desert) {
      if (y < -20) {
        if (hash < 0.005) return BlockType.Diamond;
        return BlockType.Stone;
      }
      return BlockType.Sand;
    }
    if (maxBiomeIndex === Biome.Mountains) {
      // if (y > 55 && y === height - 1) return BlockType.Snow;
      if ((y > 55 || biome[Biome.Mountains] > 0.6) && y === height - 1) return BlockType.Snow;
      if (hash < 0.005) return BlockType.Diamond;
      return BlockType.Stone;
    }
    if (maxBiomeIndex === Biome.Forest) {
      if (y < 2) {
        if (height - y <= 2) return BlockType.Sand;
        if (hash < 0.005) return BlockType.Diamond;
        return BlockType.Stone;
      }
      if (y === height - 1) return BlockType.Grass;
      return BlockType.Dirt;
    }
  }

  // Vegetation
  if (maxBiomeIndex == Biome.Desert) {
    // Small plants
    if (y === height) {
      if (hash >= 0.005 && hash < 0.01) return BlockType.GreenFlower;
      if (hash > 0.99) return BlockType.Kelp;
    }
  }

  if (maxBiomeIndex == Biome.Savanna) {
    // Structures
    const chunkHash = getChunkHash(coord);
    if (chunkHash < 0.05) {
      const { height: h, offset } = getChunkOffsetAndHeight(coord, biome, perlin);
      if (h >= 0) {
        const structure = chunkHash < 0.001 ? getStructureBlock(woolTree, offset) : getStructureBlock(tree, offset);
        if (structure) return structure;
      }
    }

    // Small plants
    if (y === height) {
      if (hash >= 0.005 && hash < 0.01) return BlockType.RedFlower;
      if (hash >= 0.01 && hash < 0.015) return BlockType.OrangeFlower;
      if (hash >= 0.015 && hash < 0.02) return BlockType.MagentaFlower;
      if (hash >= 0.025 && hash < 0.03) return BlockType.LimeFlower;
      if (hash >= 0.035 && hash < 0.04) return BlockType.PinkFlower;
      if (hash >= 0.045 && hash < 0.05) return BlockType.CyanFlower;
      if (hash >= 0.055 && hash < 0.06) return BlockType.PurpleFlower;
      if (hash >= 0.9) return BlockType.GrassPlant;
    }
  }

  if (maxBiomeIndex == Biome.Mountains) {
    // Small plants
    if (y === height) {
      if (y > 55 && hash >= 0.005 && hash < 0.01) return BlockType.GrayFlower;
      if (y <= 55 && hash >= 0.01 && hash < 0.015) return BlockType.LightBlueFlower;
      if (y <= 55 && hash >= 0.015 && hash < 0.02) return BlockType.BlackFlower;
    }
  }

  if (maxBiomeIndex == Biome.Forest) {
    // Structures
    const chunkHash = getChunkHash(coord);
    if (chunkHash < 0.2) {
      const { height: h, offset } = getChunkOffsetAndHeight(coord, biome, perlin);
      if (h >= 0) {
        const structure = chunkHash < 0.01 ? getStructureBlock(woolTree, offset) : getStructureBlock(tree, offset);
        if (structure) return structure;
      }
    }

    // Small plants
    if (y === height) {
      if (hash >= 0.005 && hash < 0.01) return BlockType.BlueFlower;
      if (hash >= 0.01 && hash < 0.015) return BlockType.LightGrayFlower;
      if (hash >= 0.95) return BlockType.GrassPlant;
    }
  }

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
  return getECSBlock(context, coord) ?? getTerrainBlock(getTerrain(coord, perlin), coord, perlin);
}
