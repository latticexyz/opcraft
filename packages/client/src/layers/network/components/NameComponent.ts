import { World } from "@latticexyz/recs";
import { defineStringComponent } from "@latticexyz/std-client";

export function defineNameComponent(world: World) {
  return defineStringComponent(world, {
    id: "Name",
    metadata: { contractId: "component.Name" },
  });
}
