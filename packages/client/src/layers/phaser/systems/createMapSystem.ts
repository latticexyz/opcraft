import { defineEnterSystem, defineRxSystem, getComponentValue, getComponentValueStrict, Has } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";
import { Textures } from "../assets/tilesets/opcraftTileset";
import { getBlockAtPosition, getTerrain } from "../../network/api";
import { createPerlin } from "@latticexyz/noise";
import { BlockIdToKey } from "../../network/constants";

// Draw the 2D map
export function createMapSystem(context: PhaserLayer, network: NetworkLayer) {
  const {
    components: { Position, Item },
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
    const position = getComponentValueStrict(Position, entity);
    const item = getComponentValueStrict(Item, entity).value;

    // Main.putTileAt(position, Textures[item]);
  });

  defineRxSystem(world, chunks.addedChunks$, async (addedChunk) => {
    // TODO: for each coordinate in the chunk:
    // - check if nothing is drawn on the tilemap yet
    // - if so, find the terrain hight (getHeight) and the terrain block at this coordinate (map 2D to 3D coord: {x: x, y: height, z: y})
    // (Hint: all the functions needed for this are in this folder in OPCraft: https://github.com/latticexyz/opcraft/tree/main/packages/client/src/layers/network/api/terrain)

    // TODO: export this from somewhere?
    const tilesPerChunk = chunks.chunkSize / 16;
    const perlin = await createPerlin();

    for (let xOffset = 0; xOffset < tilesPerChunk; xOffset++) {
      for (let yOffset = 0; yOffset < tilesPerChunk; yOffset++) {
        const x = addedChunk.x * tilesPerChunk + xOffset;
        const z = addedChunk.y * tilesPerChunk + yOffset;
        // TODO: this doesn't account for placed blocks, need to find if any are higher
        const { height: y } = getTerrain({ x, y: 0, z }, perlin);
        const entityId = getBlockAtPosition({ Position, Item, world }, perlin, { x, y, z });
        const blockType = BlockIdToKey[entityId];
        const tile = Textures[blockType];

        if (tile != null) {
          Main.putTileAt({ x, y: z }, tile);
        } else {
          console.log("Couldnt find tile for", x, y, z, blockType);
        }
      }
    }
  });
}
