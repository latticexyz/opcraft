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
  defineRxSystem(world, input.doubleClick$, (pointer) => {
    console.log("dblclick", pointer);
    const pixelCoord = { x: pointer.worldX, y: pointer.worldY };
    const { x, y: z } = pixelCoordToTileCoord(pixelCoord, TILE_WIDTH, TILE_HEIGHT);
    const biome = getBiome({ x, y: 0, z }, perlin);
    const y = getHeight({ x, y: 0, z }, biome, perlin);

    const params = new URLSearchParams(window.location.search);
    params.set("view", "game");
    params.set("x", x.toString());
    params.set("y", y.toString());
    params.set("z", z.toString());
    window.location.search = params.toString();
  });
}
