import { World } from "@latticexyz/recs";
import { defineNumberComponent } from "@latticexyz/std-client";

export function defineBlockTypeComponent(world: World) {
  return defineNumberComponent(world, {
    id: "BlockType",
    metadata: { contractId: "ember.component.blockType" },
  });
}
