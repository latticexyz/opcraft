import { AnimatedTilemap } from "@latticexyz/phaserx";
import { ZoomLevel } from "./constants";
import { createPhaserLayer } from "./createPhaserLayer";

export type PhaserLayer = Awaited<ReturnType<typeof createPhaserLayer>>;

export type Maps = { [key in ZoomLevel]: AnimatedTilemap<number, string, string> };
