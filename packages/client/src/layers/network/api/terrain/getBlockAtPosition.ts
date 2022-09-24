import { Component, EntityID, getComponentValue, getEntitiesWithValue, Type, World } from "@latticexyz/recs";
import { CoordMap, roundTowardsZero, VoxelCoord } from "@latticexyz/utils";
import { Perlin } from "@latticexyz/noise";
import { BlockType } from "../../constants";
import { Biome } from "./constants";
import { getBiome } from "./getBiome";
import { getHeight } from "./getHeight";
import { keccak256Coord } from "@latticexyz/utils";
import { BigNumber } from "ethers";
import { getStructureBlock, STRUCTURE_CHUNK, STRUCTURE_CHUNK_CENTER, Tree, WoolTree } from "./structures";

interface Terrain {
  biome: [number, number, number, number];
  height: number;
}

const hashCache = new CoordMap<number>();

export function getCoordHash(x: number, y = 0) {
  const coord = { x, y };
  const cacheHash = hashCache.get(coord);
  if (cacheHash != null) return cacheHash;

  // TODO: make this faster by using keccak-wasm
  const hash = BigNumber.from(keccak256Coord(coord)).mod(1024).toNumber();

  hashCache.set(coord, hash);
  return hash;
}

export function getTerrain(coord: VoxelCoord, perlin: Perlin): Terrain {
  const biome = getBiome(coord, perlin);
  const height = getHeight(coord, biome, perlin);
  return { biome, height };
}

function getChunkCoord({ x, z }: VoxelCoord) {
  const chunkCoord = {
    x: Math.floor(x / STRUCTURE_CHUNK),
    y: 0,
    z: Math.floor(z / STRUCTURE_CHUNK),
  };
  return chunkCoord;
}

export function getChunkHash(coord: VoxelCoord) {
  const { x, z } = getChunkCoord(coord);
  return getCoordHash(x, z);
}

export function getBiomeHash(coord: VoxelCoord, biome: Biome) {
  return getCoordHash(Math.floor(coord.x / 300) + Math.floor(coord.z / 300), biome);
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

type TerrainState = {
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

export function getTerrainBlock({ biome: biomeVector, height }: Terrain, coord: VoxelCoord, perlin: Perlin): EntityID {
  const state: TerrainState = { biomeVector, height, coord, perlin };
  return (
    Bedrock(state) ||
    Water(state) ||
    Air(state) ||
    Diamond(state) ||
    Sand(state) ||
    Stone(state) ||
    Clay(state) ||
    Snow(state) ||
    Grass(state) ||
    Dirt(state) ||
    Structure(state) ||
    SmallPlant(state) ||
    BlockType.Air
  );
}

function accessState<K extends keyof TerrainState>(state: TerrainState, prop: K): NonNullable<TerrainState[K]> {
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

function Water({ coord: { y }, height }: TerrainState): EntityID | undefined {
  if (y < 0 && y >= height) return BlockType.Water;
}

function Air({ coord: { y }, height }: TerrainState): EntityID | undefined {
  if (y >= height + 2 * STRUCTURE_CHUNK) return BlockType.Air;
}

function Bedrock({ coord: { y } }: TerrainState): EntityID | undefined {
  if (y < -255) return BlockType.Bedrock;
}

function Sand(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if (biome === Biome.Desert && y >= -20) return BlockType.Sand;

  if (y >= 2) return;
  const distanceFromHeight = accessState(state, "distanceFromHeight");
  if (biome === Biome.Savanna && distanceFromHeight <= 4) return BlockType.Sand;
  if (biome === Biome.Forest && distanceFromHeight <= 2) return BlockType.Sand;
}

function Diamond(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest, Biome.Desert].includes(biome) && y >= -20) return;

  const hash1 = accessState(state, "coordHash2D");
  if (hash1 > 5) return;

  const hash2 = accessState(state, "coordHash1D");
  if (hash2 <= 5) return BlockType.Diamond;
}

function Snow(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
    biomeVector,
  } = state;

  if (y >= height) return;
  if ((y > 55 || biomeVector[Biome.Mountains] > 0.6) && y === height - 1) return BlockType.Snow;
}

function Stone(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest, Biome.Desert].includes(biome) && y >= -20) return;

  return BlockType.Stone;
}

function Clay(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  const distanceFromHeight = accessState(state, "distanceFromHeight");
  if (biome === Biome.Savanna && y < 2 && distanceFromHeight <= 6) return BlockType.Clay;
}

function Grass(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest].includes(biome) && y === height - 1) return BlockType.Grass;
}

function Dirt(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest].includes(biome)) return BlockType.Dirt;
}

function SmallPlant(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y !== height) return;

  const hash = accessState(state, "coordHash2D");
  const biome = accessState(state, "biome");

  if (biome === Biome.Desert) {
    if (hash < 5) return BlockType.GreenFlower;
    if (hash > 990) return BlockType.Kelp;
  }

  if (biome === Biome.Savanna) {
    if (hash < 5) return BlockType.RedFlower;
    if (hash < 10) return BlockType.OrangeFlower;
    if (hash < 15) return BlockType.MagentaFlower;
    if (hash < 20) return BlockType.LimeFlower;
    if (hash < 25) return BlockType.PinkFlower;
    if (hash < 30) return BlockType.CyanFlower;
    if (hash < 35) return BlockType.PurpleFlower;
    if (hash >= 900) return BlockType.GrassPlant;
  }

  if (biome === Biome.Forest) {
    if (hash < 5) return BlockType.BlueFlower;
    if (hash < 10) return BlockType.LightGrayFlower;
    if (hash < 15) return BlockType.GrassPlant;
  }

  if (biome === Biome.Mountains) {
    if (y > 55 && hash < 5) return BlockType.GrayFlower;
    if (y <= 55 && hash < 10) return BlockType.LightBlueFlower;
    if (y <= 55 && hash < 15) return BlockType.BlackFlower;
  }
}

function Structure(state: TerrainState) {
  const {
    coord: { y },
    height,
  } = state;

  if (y < height || y < 2) return;

  const biome = accessState(state, "biome");
  if ([Biome.Mountains, Biome.Desert].includes(biome)) return;

  const hash = accessState(state, "chunkHash");

  if (biome === Biome.Savanna && hash < 50) {
    const chunkHeight = accessState(state, "chunkHeight");
    if (chunkHeight <= 0) return;
    const chunkOffset = accessState(state, "chunkOffset");
    const biomeHash = accessState(state, "biomeHash");
    const structure =
      hash < roundTowardsZero(biomeHash / 40)
        ? getStructureBlock(WoolTree, chunkOffset)
        : getStructureBlock(Tree, chunkOffset);
    if (structure) return structure;
  }

  if (biome === Biome.Forest && hash < 200) {
    const chunkHeight = accessState(state, "chunkHeight");
    if (chunkHeight <= 0) return;
    const chunkOffset = accessState(state, "chunkOffset");
    const biomeHash = accessState(state, "biomeHash");
    const structure =
      hash < roundTowardsZero(biomeHash / 10)
        ? getStructureBlock(WoolTree, chunkOffset)
        : getStructureBlock(Tree, chunkOffset);
    if (structure) return structure;
  }
}
