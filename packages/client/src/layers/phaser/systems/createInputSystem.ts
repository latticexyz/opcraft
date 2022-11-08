import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { defineRxSystem } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { getBiome } from "../../network/api";
import { getHeight } from "../../network/api/terrain/getHeight";
import { TILE_WIDTH, TILE_HEIGHT } from "../constants";
import { PhaserLayer } from "../types";

export function createInputSystem(context: PhaserLayer, network: NetworkLayer) {
  const {
    world,
    scenes: {
      Main: { input },
    },
  } = context;
  const { perlin } = network;

  // TODO: highlight tile on hover, then use click instead of double click to teleport
  //       or optionally click once to select a tile, then click a button in UI to teleport
  defineRxSystem(world, input.doubleClick$, async (pointer) => {
    if (!window.layers?.noa) {
      console.log("not teleporting, no noa layer");
      return;
    }
    if (!window.layers.noa.noa._paused) {
      console.log("not teleporting, noa is not paused (already in noa?)");
      return;
    }

    const pixelCoord = { x: pointer.worldX, y: pointer.worldY };

    // TODO: create helper to get x,y,z from pixel coord (same logic used in map)
    //       this should hopefully give us a better y/height value
    const { x, y: z } = pixelCoordToTileCoord(pixelCoord, TILE_WIDTH, TILE_HEIGHT);
    const biome = getBiome({ x, y: 0, z }, perlin);
    const y = getHeight({ x, y: 0, z }, biome, perlin);

    await window.changeView?.("game");
    window.layers?.noa?.api.teleport({ x, y, z });
  });
}
