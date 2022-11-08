import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { defineRxSystem } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { TILE_WIDTH, TILE_HEIGHT } from "../constants";
import { getHighestTilesAt } from "../getHighestTilesAt";
import { PhaserLayer } from "../types";

export function createInputSystem(context: PhaserLayer, network: NetworkLayer) {
  const {
    world,
    scenes: {
      Main: { input },
    },
  } = context;
  const {
    perlin,
    components: { Position, Item, Position2D },
  } = network;

  // TODO: highlight tile on hover, then use click instead of double click to teleport
  //       or optionally click once to select a tile, then click a button in UI to teleport
  // TODO: don't activate double click if clicking within an input, label, etc. to not interfere with form elements
  defineRxSystem(world, input.doubleClick$, async (pointer) => {
    if ((pointer.event.target as HTMLElement)?.nodeName !== "CANVAS") {
      console.log("not teleporting, clicked outside canvas");
      return;
    }

    if (!window.layers?.noa) {
      console.log("not teleporting, no noa layer");
      return;
    }
    if (!window.layers.noa.noa._paused) {
      console.log("not teleporting, noa is not paused (already in noa?)");
      return;
    }

    const pixelCoord = { x: pointer.worldX, y: pointer.worldY };
    const { x, y: z } = pixelCoordToTileCoord(pixelCoord, TILE_WIDTH, TILE_HEIGHT);
    const highestTiles = getHighestTilesAt({ x, z, perlin, Position, Item, Position2D });
    if (!highestTiles) {
      console.log("not teleporting, no highest tile found at", pixelCoord);
      return;
    }

    await window.changeView?.("game");
    // offset x, z by 0.5 to center player on block
    // and offset y by 1 to be above block
    // TODO: should this be part of teleport itself?
    window.layers?.noa?.api.teleport({ x: x + 0.5, y: highestTiles.y + 1, z: z + 0.5 });
  });
}
