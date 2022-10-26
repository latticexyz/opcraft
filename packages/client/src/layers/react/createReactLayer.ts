import { namespaceWorld } from "@latticexyz/recs";
import { NetworkLayer } from "../network";
import { NoaLayer } from "../noa";

export function createReactLayer(network: NetworkLayer, noa: NoaLayer) {
  const world = namespaceWorld(noa.world, "react");
  const components = {};
  return { world, components };
}
