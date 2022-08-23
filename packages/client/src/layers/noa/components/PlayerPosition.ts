import { World } from "@latticexyz/recs";
import { defineVoxelCoordComponent } from "@latticexyz/std-client";

export function definePlayerPositionComponent(world: World) {
  return defineVoxelCoordComponent(world, { id: "PlayerPosition" });
}
