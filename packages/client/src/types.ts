import { boot } from "./boot";
import { NetworkLayer } from "./layers/network";
import { NoaLayer } from "./layers/noa";

export type EmberWindow = Awaited<ReturnType<typeof boot>>;

export type Layers = { network: NetworkLayer; noa: NoaLayer };
