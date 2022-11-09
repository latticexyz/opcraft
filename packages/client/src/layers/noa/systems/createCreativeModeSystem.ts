import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export function createCreativeModeSystem(network: NetworkLayer, context: NoaLayer) {
  const { noa } = context;
  noa.ents.getMovement(1).airJumps = 999;
}
