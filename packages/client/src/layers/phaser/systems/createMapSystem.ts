import { defineEnterSystem, defineRxSystem, getComponentValueStrict, Has } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";
import { BackgroundTiles, ForegroundTiles } from "../assets/tilesets/opcraftTileset";
import { getBiome, getTerrainBlock } from "../../network/api";
import { BlockIdToKey } from "../../network/constants";
import { getHeight } from "../../network/api/terrain/getHeight";
import { isStructureChunk } from "../../network/api/terrain/occurrence";
import { STRUCTURE_CHUNK } from "../../network/api/terrain/constants";
import { CoordMap } from "@latticexyz/utils";
import { concat, from } from "rxjs";
import { TILE_HEIGHT } from "../constants";

const cache = new CoordMap<boolean>();

// Draw the 2D map
export function createMapSystem(context: PhaserLayer, network: NetworkLayer) {
  const {
    components: { Position, Item },
    perlin,
  } = network;

  const {
    world,
    scenes: {
      Main: {
        maps: { Main },
      },
    },
    chunks,
  } = context;

  // Draw map for ECS tiles
  defineEnterSystem(world, [Has(Position), Has(Item)], ({ entity }) => {
    console.log("entered", entity);
    const position = getComponentValueStrict(Position, entity);
    const item = getComponentValueStrict(Item, entity).value;

    // Main.putTileAt(position, Textures[item]);
  });

  // Concat with the visible chunks on page load
  const addedChunks$ = concat(from(chunks.visibleChunks.current.coords()), chunks.addedChunks$);

  // TODO: maybe move terrain exploration to webworker to reduce lags in main thread?
  defineRxSystem(world, addedChunks$, async (addedChunk) => {
    // TODO: export these from somewhere?
    const tilesPerChunk = chunks.chunkSize / TILE_HEIGHT;

    for (let xOffset = 0; xOffset < tilesPerChunk; xOffset++) {
      for (let yOffset = 0; yOffset < tilesPerChunk; yOffset++) {
        const x = addedChunk.x * tilesPerChunk + xOffset;
        const z = addedChunk.y * tilesPerChunk + yOffset;

        if (cache.get({ x, y: z })) continue;

        const biome = getBiome({ x, y: 0, z }, perlin);
        const height = getHeight({ x, y: 0, z }, biome, perlin);
        const structureChunk = isStructureChunk({ biomeVector: biome, height, coord: { x, y: height + 1, z }, perlin });
        const heightLimit = structureChunk ? height + STRUCTURE_CHUNK : height;

        // iterate through Y position since perlin terrain may not have the highest placed block
        // TODO: is there a more efficient way to do this?
        // -> I think we should separately check for ECS blocks at this coord (and pre-process the ECS state to only contain the highest block)
        for (let y = heightLimit; y >= height - 1; y--) {
          const entityId = getTerrainBlock({ biome, height }, { x, y, z }, perlin);
          const blockType = BlockIdToKey[entityId];

          if (blockType === "Air") continue;

          const foregroundTile = ForegroundTiles[blockType];
          if (foregroundTile) {
            Main.putTileAt({ x, y: z }, foregroundTile, "Foreground");
            // Continue down y axis to get the background tile
            continue;
          }
          const backgroundTile = BackgroundTiles[blockType];
          if (backgroundTile) {
            Main.putTileAt({ x, y: z }, backgroundTile, "Background");
            // Stop drawing tile for this x, z
            break;
          }

          // Ignore flowers for now
          // if (!blockType.endsWith("Flower")) {
          //   console.log(`No background tile found for block type ${blockType}`);
          // }
        }

        cache.set({ x, y: z }, true);
      }
    }
  });
}
