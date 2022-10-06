import { World } from "@latticexyz/recs";
import { defineNumberComponent } from "@latticexyz/std-client";

export function defineStakeComponent(world: World) {
  return defineNumberComponent(world, {
    id: "Stake",
    metadata: { contractId: "component.Stake" },
  });
}
