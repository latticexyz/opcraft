import { Component, EntityID, getComponentValue, getEntitiesWithValue, Type, World } from "@latticexyz/recs";
import { VoxelCoord } from "@latticexyz/utils";
import { Perlin } from "@latticexyz/noise";
import { BlockType } from "../../constants";
import { Terrain, TerrainState } from "./types";
import { getTerrain } from "./utils";
import {
  Air,
  Bedrock,
  Clay,
  Coal,
  Diamond,
  Dirt,
  Grass,
  Sand,
  SmallPlant,
  Snow,
  Stone,
  Structure,
  Water,
} from "./occurrence";

export function getEntityAtPosition(
  context: {
    Position: Component<{ x: Type.Number; y: Type.Number; z: Type.Number }>;
    Item: Component<{ value: Type.String }>;
    world: World;
  },
  coord: VoxelCoord
) {
  const { Position, Item } = context;
  const entitiesAtPosition = [...getEntitiesWithValue(Position, coord)];

  // Prefer non-air blocks at this position
  return (
    entitiesAtPosition?.find((b) => {
      const item = getComponentValue(Item, b);
      return item && item.value !== BlockType.Air;
    }) ?? entitiesAtPosition[0]
  );
}

export function getECSBlock(
  context: {
    Position: Component<{ x: Type.Number; y: Type.Number; z: Type.Number }>;
    Item: Component<{ value: Type.String }>;
    world: World;
  },
  coord: VoxelCoord
): EntityID | undefined {
  const entityAtPosition = getEntityAtPosition(context, coord);
  if (entityAtPosition == null) return undefined;
  return getComponentValue(context.Item, entityAtPosition)?.value as EntityID;
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

export function getTerrainBlock({ biome: biomeVector, height }: Terrain, coord: VoxelCoord, perlin: Perlin): EntityID {
  const state: TerrainState = { biomeVector, height, coord, perlin };
  return (
    Bedrock(state) ||
    Water(state) ||
    Air(state) ||
    Diamond(state) ||
    Coal(state) ||
    Sand(state) ||
    Snow(state) ||
    Grass(state) ||
    Stone(state) ||
    Clay(state) ||
    Dirt(state) ||
    Structure(state) ||
    SmallPlant(state) ||
    BlockType.Air
  );
}
