import { ecs } from "./boot";
import { NetworkLayer } from "./layers/network";
import { NoaLayer } from "./layers/noa";
import { ReactLayer } from "./layers/react";

export type Layers = { network: NetworkLayer; noa: NoaLayer; react: ReactLayer };
export type Window = typeof window & { layers: Layers; ecs: typeof ecs };
