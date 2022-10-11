import { SyncState } from "@latticexyz/network";
import { defineComponentSystem, getComponentValueStrict, hasComponent } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { MINING_BLOCK_COMPONENT } from "../engine/components/miningBlockComponent";
import { setNoaPosition } from "../engine/components/utils";
import { NoaLayer } from "../types";

export function createSpawnPlayerSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    noa,
    SingletonEntity,
    components: { LocalPlayerPosition },
  } = context;

  const {
    world,
    components: { LoadingState },
  } = network;
  defineComponentSystem(world, LoadingState, (update) => {
    const currentValue = update.value[0];
    const entity = update.entity;
    if (entity !== SingletonEntity) return;
    if (currentValue?.state === SyncState.LIVE) {
      noa.entities.addComponentAgain(noa.playerEntity, MINING_BLOCK_COMPONENT, {});
      if (hasComponent(LocalPlayerPosition, SingletonEntity)) {
        setNoaPosition(noa, noa.playerEntity, getComponentValueStrict(LocalPlayerPosition, SingletonEntity));
      }
    }
  });
}
