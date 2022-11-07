import { SyncState } from "@latticexyz/network";
import { getComponentValue, getComponentValueStrict, hasComponent } from "@latticexyz/recs";
import { awaitStreamValue } from "@latticexyz/utils";
import { concat, map, of } from "rxjs";
import { NetworkLayer } from "../../network";
import { SPAWN_POINT } from "../constants";
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
    components: { LoadingState },
  } = network;

  const loadingState$ = concat(
    of(getComponentValue(LoadingState, SingletonEntity)?.state),
    LoadingState.update$.pipe(map((e) => e.value[0]?.state))
  );

  awaitStreamValue(loadingState$, (state) => state === SyncState.LIVE).then(() => {
    noa.entities.addComponentAgain(noa.playerEntity, MINING_BLOCK_COMPONENT, {});

    // Reset gravity once world is loaded
    const body = noa.ents.getPhysics(1)?.body;
    if (body) body.gravityMultiplier = 2;

    if (hasComponent(LocalPlayerPosition, SingletonEntity)) {
      console.log(
        "setting noa position from local player position",
        getComponentValueStrict(LocalPlayerPosition, SingletonEntity)
      );
      setNoaPosition(noa, noa.playerEntity, getComponentValueStrict(LocalPlayerPosition, SingletonEntity));
    } else {
      console.log("setting noa position to spawn", SPAWN_POINT);
      setNoaPosition(noa, noa.playerEntity, SPAWN_POINT);
    }
  });
}
