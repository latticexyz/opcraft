import { World } from "@latticexyz/recs";
import { defineStringComponent } from "@latticexyz/std-client";

export function defineItemComponent(world: World) {
  return defineStringComponent(world, {
    id: "Item",
    metadata: { contractId: "component.Item" },
  });
}
