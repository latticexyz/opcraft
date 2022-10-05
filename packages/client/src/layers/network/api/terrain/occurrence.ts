import { EntityID } from "@latticexyz/recs";
import { BlockType } from "../../constants";
import { STRUCTURE_CHUNK, Biome } from "./constants";
import { getStructureBlock, WoolTree, Tree } from "./structures";
import { TerrainState } from "./types";
import { accessState } from "./utils";

export function Water({ coord: { y }, height }: TerrainState): EntityID | undefined {
  if (y < 0 && y >= height) return BlockType.Water;
}

export function Air({ coord: { y }, height }: TerrainState): EntityID | undefined {
  if (y >= height + 2 * STRUCTURE_CHUNK) return BlockType.Air;
}

export function Bedrock({ coord: { y } }: TerrainState): EntityID | undefined {
  if (y <= -63) return BlockType.Bedrock;
}

export function Sand(state: TerrainState): EntityID | undefined {
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

export function Diamond(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest, Biome.Desert].includes(biome) && y >= -20) return;

  const hash1 = accessState(state, "coordHash2D");
  if (hash1 > 10) return;

  const hash2 = accessState(state, "coordHash1D");
  if (hash2 <= 10) return BlockType.Diamond;
}

export function Coal(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest, Biome.Desert].includes(biome) && y >= -20) return;

  const hash1 = accessState(state, "coordHash2D");
  if (hash1 <= 10 || hash1 > 50) return;

  const hash2 = accessState(state, "coordHash1D");
  if (hash2 > 10 && hash2 <= 50) return BlockType.Coal;
}

export function Snow(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
    biomeVector,
  } = state;

  if (y >= height) return;
  if ((y > 55 || biomeVector[Biome.Mountains] > 0.6) && y === height - 1) return BlockType.Snow;
}

export function Stone(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest, Biome.Desert].includes(biome) && y >= -20) return;

  return BlockType.Stone;
}

export function Clay(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  const distanceFromHeight = accessState(state, "distanceFromHeight");
  if (biome === Biome.Savanna && y < 2 && distanceFromHeight <= 6) return BlockType.Clay;
}

export function Grass(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;
  if (y < 0) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest].includes(biome) && y === height - 1) return BlockType.Grass;
  if (biome === Biome.Mountains && y < 40 && y === height - 1) return BlockType.Grass;
}

export function Dirt(state: TerrainState): EntityID | undefined {
  const {
    coord: { y },
    height,
  } = state;

  if (y >= height) return;

  const biome = accessState(state, "biome");
  if ([Biome.Savanna, Biome.Forest].includes(biome)) return BlockType.Dirt;
}

export function SmallPlant(state: TerrainState): EntityID | undefined {
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

export function Structure(state: TerrainState) {
  const {
    coord: { y },
    height,
  } = state;

  if (y < height || y < 0) return;

  const biome = accessState(state, "biome");
  if ([Biome.Mountains, Biome.Desert].includes(biome)) return;

  const hash = accessState(state, "chunkHash");

  if (biome === Biome.Savanna && hash < 50) {
    const chunkHeight = accessState(state, "chunkHeight");
    if (chunkHeight <= 0) return;
    const chunkOffset = accessState(state, "chunkOffset");
    const biomeHash = accessState(state, "biomeHash");
    const structure =
      hash < Math.floor(biomeHash / 40)
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
      hash < Math.floor(biomeHash / 10)
        ? getStructureBlock(WoolTree, chunkOffset)
        : getStructureBlock(Tree, chunkOffset);
    if (structure) return structure;
  }
}
