import { defineRxSystem } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { TILE_HEIGHT, TILE_WIDTH } from "../constants";
import { PhaserLayer } from "../types";

export function createTileHoverSystem(context: PhaserLayer, _network: NetworkLayer) {
  const {
    world,
    scenes: {
      Main: { input, phaserScene },
    },
  } = context;

  // TODO: figure out why this isn't loading
  phaserScene.load.image("tileHover", "assets/blocks/18-Brown_mushroom.png");
  const sprite = phaserScene.add.sprite(0, 0, "tileHover").setOrigin(0, 0).setVisible(false);

  defineRxSystem(world, input.pointermove$, async ({ pointer }) => {
    sprite.setVisible(true);
    // TODO: hide after at timeout?
    // TODO: figure out how to remount when map changes due to zoom step
    sprite.setPosition(
      // TODO: scale with zoom, prob via a stream transform + only updating when actually changed
      Math.floor(pointer.worldX / TILE_WIDTH) * TILE_WIDTH,
      Math.floor(pointer.worldY / TILE_HEIGHT) * TILE_HEIGHT
    );
  });
}
