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

function getCoordHash(x: number, y = 0) {
  const coord = { x, y };
  const cacheHash = hashCache.get(coord);
  if (cacheHash != null) return cacheHash;

  // TODO: make this faster by using keccak-wasm
  const hash = BigNumber.from(keccak256Coord(coord)).mod(1024).toNumber() / 1024;

  hashCache.set(coord, hash);
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
  const { x, z } = getChunkCoord(coord);
  return getCoordHash(x, z);
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

type ComputationState = {
  coord: VoxelCoord;
  terrain: Terrain;
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

export function getTerrainBlock(terrain: Terrain, coord: VoxelCoord, perlin: Perlin): EntityID {
  const state: ComputationState = { terrain, coord, perlin };
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

function accessState<K extends keyof ComputationState>(
  state: ComputationState,
  prop: K
): NonNullable<ComputationState[K]> {
  let value = state[prop];
  if (value != null) return value;
  const { coord, terrain, perlin } = state;

  if (prop === "biome") {
    const { biome } = terrain;
    state.biome = biome.findIndex((x) => x === Math.max(...biome));
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
    state.biomeHash = getCoordHash(Math.floor(coord.x / 300) + Math.floor(coord.y / 300), accessState(state, "biome"));
  }

  if (prop === "chunkOffset" || prop === "chunkHeight") {
    const { height, offset } = getChunkOffsetAndHeight(coord, terrain.biome, perlin);
    state.chunkHeight = height;
    state.chunkOffset = offset;
  }

  if (prop === "distanceFromHeight") {
    state.distanceFromHeight = terrain.height - coord.y;
  }

  value = state[prop];
  if (value == null) throw new Error("Can not find prop " + prop);
  return value;
}

function Water({ coord: { y }, terrain: { height } }: ComputationState): EntityID | undefined {
  if (y < 0 && y >= height) return BlockType.Water;
}

function Air({ coord: { y }, terrain: { height } }: ComputationState): EntityID | undefined {
  if (y >= height + 2 * STRUCTURE_CHUNK) return BlockType.Air;
}

function Bedrock({ coord: { y } }: ComputationState): EntityID | undefined {
  if (y < -255) return BlockType.Bedrock;
}

function Sand(state: ComputationState): EntityID | undefined {
  const {
    coord: { y },
    terrain: { height },
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if (biome === Biome.Desert && y >= -20) return BlockType.Sand;

  if (y >= 2) return;
  const distanceFromHeight = accessState(state, "distanceFromHeight");
  if (biome === Biome.Savanna && distanceFromHeight <= 4) return BlockType.Sand;
  if (biome === Biome.Forest && distanceFromHeight <= 2) return BlockType.Sand;
}

function Diamond(state: ComputationState): EntityID | undefined {
  const {
    coord: { y },
    terrain: { height },
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest, Biome.Desert].includes(biome) && y >= -20) return;

  const hash1 = accessState(state, "coordHash2D");
  if (hash1 > 0.005) return;

  const hash2 = accessState(state, "coordHash1D");
  if (hash2 <= 0.005) return BlockType.Diamond;
}

function Snow(state: ComputationState): EntityID | undefined {
  const {
    coord: { y },
    terrain: { height, biome },
  } = state;

  if (y >= height) return;
  if ((y > 55 || biome[Biome.Mountains] > 0.6) && y === height - 1) return BlockType.Snow;
}

function Stone(state: ComputationState): EntityID | undefined {
  const {
    coord: { y },
    terrain: { height },
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest, Biome.Desert].includes(biome) && y >= -20) return;

  return BlockType.Stone;
}

function Clay(state: ComputationState): EntityID | undefined {
  const {
    coord: { y },
    terrain: { height },
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  const distanceFromHeight = accessState(state, "distanceFromHeight");
  if (biome === Biome.Savanna && y < 2 && distanceFromHeight <= 6) return BlockType.Clay;
}

function Grass(state: ComputationState): EntityID | undefined {
  const {
    coord: { y },
    terrain: { height },
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest].includes(biome) && y === height - 1) return BlockType.Grass;
}

function Dirt(state: ComputationState): EntityID | undefined {
  const {
    coord: { y },
    terrain: { height },
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest].includes(biome)) return BlockType.Dirt;
}

function SmallPlant(state: ComputationState): EntityID | undefined {
  const {
    coord: { y },
    terrain: { height },
  } = state;

  if (y !== height) return;

  const hash = accessState(state, "coordHash2D");
  const biome = accessState(state, "biome");

  if (biome === Biome.Desert) {
    if (hash >= 0.005 && hash < 0.01) return BlockType.GreenFlower;
    if (hash > 0.99) return BlockType.Kelp;
  }

  if (biome === Biome.Savanna) {
    if (hash >= 0.005 && hash < 0.01) return BlockType.RedFlower;
    if (hash >= 0.01 && hash < 0.015) return BlockType.OrangeFlower;
    if (hash >= 0.015 && hash < 0.02) return BlockType.MagentaFlower;
    if (hash >= 0.025 && hash < 0.03) return BlockType.LimeFlower;
    if (hash >= 0.035 && hash < 0.04) return BlockType.PinkFlower;
    if (hash >= 0.045 && hash < 0.05) return BlockType.CyanFlower;
    if (hash >= 0.055 && hash < 0.06) return BlockType.PurpleFlower;
    if (hash >= 0.9) return BlockType.GrassPlant;
  }

  if (biome === Biome.Forest) {
    if (hash >= 0.005 && hash < 0.01) return BlockType.BlueFlower;
    if (hash >= 0.01 && hash < 0.015) return BlockType.LightGrayFlower;
    if (hash >= 0.95) return BlockType.GrassPlant;
  }

  if (biome === Biome.Mountains) {
    if (y > 55 && hash >= 0.005 && hash < 0.01) return BlockType.GrayFlower;
    if (y <= 55 && hash >= 0.01 && hash < 0.015) return BlockType.LightBlueFlower;
    if (y <= 55 && hash >= 0.015 && hash < 0.02) return BlockType.BlackFlower;
  }
}

function Structure(state: ComputationState) {
  const {
    coord: { y },
    terrain: { height },
  } = state;

  if (y < height || y < 2) return;

  const biome = accessState(state, "biome");
  if ([Biome.Mountains, Biome.Desert].includes(biome)) return;

  const hash = accessState(state, "chunkHash");

  if (biome === Biome.Savanna && hash < 0.05) {
    const chunkHeight = accessState(state, "chunkHeight");
    if (chunkHeight <= 0) return;
    const chunkOffset = accessState(state, "chunkOffset");
    const biomeHash = accessState(state, "biomeHash");
    const structure =
      hash < biomeHash * 0.025 ? getStructureBlock(woolTree, chunkOffset) : getStructureBlock(tree, chunkOffset);
    if (structure) return structure;
  }

  if (biome === Biome.Forest && hash < 0.2) {
    const chunkHeight = accessState(state, "chunkHeight");
    if (chunkHeight <= 0) return;
    const chunkOffset = accessState(state, "chunkOffset");
    const biomeHash = accessState(state, "biomeHash");
    const structure =
      hash < biomeHash * 0.1 ? getStructureBlock(woolTree, chunkOffset) : getStructureBlock(tree, chunkOffset);
    if (structure) return structure;
  }
}
