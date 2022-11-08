import { Component, EntityID, getComponentValueStrict, getEntitiesWithValue, Type } from "@latticexyz/recs";
import { NetworkLayer } from "../network";
import { PhaserLayer } from "./types";
import { BackgroundTiles, ForegroundTiles } from "./assets/tilesets/opcraftTileset";
import { getBiome, getTerrainBlock, getHeight } from "../network/api";
import { BlockIdToKey, BlockTypeKey } from "../network/constants";
import { isStructureChunk } from "../network/api/terrain/occurrence";
import { STRUCTURE_CHUNK } from "../network/api/terrain/constants";
import orderBy from "lodash/orderBy";
import { uniqBy } from "lodash";
import { Perlin } from "@latticexyz/noise";

export const getHighestTilesAt = ({
  x,
  z,
  perlin,
  Position2D,
  Position,
  Item,
}: {
  x: number;
  z: number;
  perlin: Perlin;
  Position2D: Component<{ x: Type.Number; y: Type.Number }>;
  Position: Component<{ x: Type.Number; y: Type.Number; z: Type.Number }>;
  Item: Component<{ value: Type.String }>;
}) => {
  const biome = getBiome({ x, y: 0, z }, perlin);
  const height = getHeight({ x, y: 0, z }, biome, perlin);
  const structureChunk = isStructureChunk({ biomeVector: biome, height, coord: { x, y: height + 1, z }, perlin });
  const terrainHeightLimit = structureChunk ? height + STRUCTURE_CHUNK : height;

  const ecsBlocks = uniqBy(
    orderBy(
      [...getEntitiesWithValue(Position2D, { x, y: z })].map((entity) => ({
        entity,
        position: getComponentValueStrict(Position, entity),
      })),
      ["position.y", "entity"],
      ["desc", "desc"]
    ),
    "position.y"
  ).map((block) => {
    const item = getComponentValueStrict(Item, block.entity).value;
    return {
      ...block,
      item,
      blockType: BlockIdToKey[item as EntityID],
    };
  });

  const heightLimit = ecsBlocks.reduce((max, block) => Math.max(max, block.position.y), terrainHeightLimit);
  const ecsBlockTypes: Partial<Record<`${number},${number},${number}`, BlockTypeKey>> = Object.fromEntries(
    ecsBlocks.map((block) => [`${block.position.x},${block.position.y},${block.position.z}`, block.blockType])
  );

  let foregroundBlockType: keyof typeof ForegroundTiles | undefined;
  let backgroundBlockType: keyof typeof BackgroundTiles | undefined;

  for (let y = heightLimit; y >= -64; y--) {
    let blockType = ecsBlockTypes[`${x},${y},${z}`];
    if (!blockType) {
      const entityId = getTerrainBlock({ biome, height }, { x, y, z }, perlin);
      blockType = BlockIdToKey[entityId];
    }
    if (!blockType || blockType === "Air") continue;

    foregroundBlockType ??= Object.hasOwn(ForegroundTiles, blockType) ? blockType : undefined;
    backgroundBlockType = Object.hasOwn(BackgroundTiles, blockType) ? blockType : undefined;
    if (backgroundBlockType) {
      return {
        x,
        y,
        z,
        foregroundBlockType,
        foregroundTile: foregroundBlockType ? ForegroundTiles[foregroundBlockType] : undefined,
        backgroundBlockType,
        backgroundTile: backgroundBlockType ? BackgroundTiles[backgroundBlockType] : undefined,
      };
    }
  }
};
