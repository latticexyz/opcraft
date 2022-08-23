import { World } from "@latticexyz/recs";
import { defineVoxelCoordComponent } from "@latticexyz/std-client";

export function definePlayerDirectionComponent(world: World) {
  return defineVoxelCoordComponent(world, { id: "PlayerDirection" });
}
