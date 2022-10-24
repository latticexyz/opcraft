import { World } from "@latticexyz/recs";
import { defineVoxelCoordComponent } from "@latticexyz/std-client";

export function definePreTeleportPositionComponent(world: World) {
  return defineVoxelCoordComponent(world, { id: "PreTeleportPosition" });
}
