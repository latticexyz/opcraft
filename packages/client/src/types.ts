import { ecs } from "./boot";
import { NetworkLayer } from "./layers/network";
import { NoaLayer } from "./layers/noa";
import { PhaserLayer } from "./layers/phaser";

export type Layers = { network: NetworkLayer; noa: NoaLayer; phaser: PhaserLayer };
export type Window = typeof window & { layers: Layers; ecs: typeof ecs; remountReact: () => Promise<void> };
