import { defineRxSystem } from "@latticexyz/recs";
import { BehaviorSubject, map } from "rxjs";
import { NetworkLayer } from "../../network";
import { TILE_HEIGHT, TILE_WIDTH } from "../constants";
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

  const pointerPosition$ = new BehaviorSubject({ x: 0, y: 0 });
  input.pointermove$.pipe(map(({ pointer }) => ({ x: pointer.worldX, y: pointer.worldY }))).subscribe(pointerPosition$);

  defineRxSystem(world, zoomLevel$, ({ zoomMultiplier }) => {
    sprite.setSize(TILE_WIDTH * zoomMultiplier, TILE_HEIGHT * zoomMultiplier);
    // TODO: reset position now that zoom level has changed?
  });

  defineRxSystem(world, input.pointermove$, async ({ pointer }) => {
    // console.log("got pointer position", pointer);
    sprite.setVisible(true);
    // TODO: hide after at timeout?
    // TODO: figure out how to remount when map changes due to zoom step
    sprite.setPosition(
      Math.floor(pointer.worldX / sprite.width) * sprite.width,
      Math.floor(pointer.worldY / sprite.height) * sprite.height
    );
  });
}
