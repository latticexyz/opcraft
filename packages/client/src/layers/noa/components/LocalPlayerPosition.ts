import { World } from "@latticexyz/recs";
import { defineVoxelCoordComponent } from "@latticexyz/std-client";

export function defineLocalPlayerPositionComponent(world: World) {
  return defineVoxelCoordComponent(world, { id: "LocalPlayerPosition" });
}
