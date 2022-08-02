import { World } from "@latticexyz/recs";
import { defineVoxelCoordComponent } from "@latticexyz/std-client";

export function defineLocalPositionComponent(world: World) {
  return defineVoxelCoordComponent(world, { id: "LocalPosition" });
}
