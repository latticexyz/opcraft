import { World } from "@latticexyz/recs";
import { defineStringComponent } from "@latticexyz/std-client";

export function defineEntityIdComponent(world: World) {
  return defineStringComponent(world, {
    id: "EntityId",
    metadata: { contractId: "component.EntityId" },
  });
}
