import { defineEnterSystem, defineRxSystem, getComponentValueStrict, Has } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";
import { Textures } from "../assets/tilesets/opcraftTileset";

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

    Main.putTileAt(position, Textures[item]);
  });

  defineRxSystem(world, chunks.addedChunks$, (addedChunk) => {
    // TODO: for each coordinate in the chunk:
    // - check if nothing is drawn on the tilemap yet
    // - if so, find the terrain hight (getHeight) and the terrain block at this coordinate (map 2D to 3D coord: {x: x, y: height, z: y})
    // (Hint: all the functions needed for this are in this folder in OPCraft: https://github.com/latticexyz/opcraft/tree/main/packages/client/src/layers/network/api/terrain)
    console.log("Chunk appeared in viewport", addedChunk);
  });
}
