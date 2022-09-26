import { World } from "@latticexyz/recs";
import { defineVoxelCoordComponent } from "@latticexyz/std-client";

export function definePositionComponent(world: World) {
  return defineVoxelCoordComponent(world, {
    id: "Position",
    metadata: { contractId: "component.Position" },
  });
}
