import { defineComponentSystem } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export function createCreativeModeSystem(network: NetworkLayer, context: NoaLayer) {
  const { noa, SingletonEntity } = context;

  const {
    world,
    components: { GameConfig },
  } = network;

  defineComponentSystem(world, GameConfig, (update) => {
    const entity = update.entity;
    if (entity !== SingletonEntity) return;
    const currentValue = update.value[0];
    if (currentValue?.creativeMode) {
      noa.ents.getMovement(1).airJumps = 999;
    } else {
      noa.ents.getMovement(1).airJumps = 1;
    }
  });
}
