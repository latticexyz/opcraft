import { Mesh, StandardMaterial, Color3 } from "@babylonjs/core";
import { defineSyncSystem, getComponentValueStrict, Has } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export function createSyncSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    components: { LocalPosition },
  } = context;

  const {
    world,
    components: { Position },
  } = network;

  defineSyncSystem(
    world,
    [Has(Position)],
    () => LocalPosition,
    (e) => {
      const v = getComponentValueStrict(Position, e);
      return v;
    }
  );
}
