import { World } from "@latticexyz/recs";
import { defineStringComponent } from "@latticexyz/std-client";

export function defineOwnedByComponent(world: World) {
  return defineStringComponent(world, {
    id: "OwnedBy",
    metadata: { contractId: "component.OwnedBy" },
  });
}
