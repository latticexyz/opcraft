import { defineRxSystem } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { TILE_WIDTH } from "../constants";
import { PhaserLayer } from "../types";

export function createTileHoverSystem(context: PhaserLayer, _network: NetworkLayer) {
  const {
    world,
    scenes: {
      Main: { input, phaserScene },
    },
    zoomLevel$,
  } = context;

  const sprite = phaserScene.add.sprite(0, 0, "tileHover").setOrigin(0, 0).setVisible(false);
  sprite.depth = 1000;

  defineRxSystem(world, zoomLevel$, ({ zoomMultiplier }) => {
    sprite.setScale(zoomMultiplier);
    sprite.setPosition(
      Math.floor(sprite.x / sprite.displayWidth) * sprite.displayWidth,
      Math.floor(sprite.y / sprite.displayHeight) * sprite.displayHeight
    );
  });

  defineRxSystem(world, input.pointermove$, async ({ pointer }) => {
    sprite.setVisible(true);
    // TODO: hide after at timeout?
    sprite.setPosition(
      Math.floor(pointer.worldX / sprite.displayWidth) * sprite.displayWidth,
      Math.floor(pointer.worldY / sprite.displayHeight) * sprite.displayHeight
    );
  });
}
