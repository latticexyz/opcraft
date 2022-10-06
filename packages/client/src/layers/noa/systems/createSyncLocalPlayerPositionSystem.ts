import { defineRxSystem, setComponent } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export function createSyncLocalPlayerPositionSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    components: { LocalPlayerPosition },
    SingletonEntity,
    streams: { slowPlayerPosition$ },
    world,
  } = context;

  defineRxSystem(world, slowPlayerPosition$, (pos) => {
    setComponent(LocalPlayerPosition, SingletonEntity, pos);
  });
}
