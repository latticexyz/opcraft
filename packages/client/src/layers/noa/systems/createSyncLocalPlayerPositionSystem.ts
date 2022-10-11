import { SyncState } from "@latticexyz/network";
import { defineRxSystem, getComponentValueStrict, hasComponent, setComponent } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export function createSyncLocalPlayerPositionSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    components: { LoadingState },
  } = network;
  const {
    components: { LocalPlayerPosition },
    SingletonEntity,
    streams: { slowPlayerPosition$ },
    world,
  } = context;

  defineRxSystem(world, slowPlayerPosition$, (pos) => {
    if (!hasComponent(LoadingState, SingletonEntity)) return;
    if (getComponentValueStrict(LoadingState, SingletonEntity).state !== SyncState.LIVE) {
      return;
    }
    setComponent(LocalPlayerPosition, SingletonEntity, pos);
  });
}
