import { World } from "@latticexyz/recs";
import { defineCoordComponent } from "@latticexyz/std-client";

export function definePlayerRelayerChunkPositionComponent(world: World) {
  return defineCoordComponent(world, { id: "PlayerRelayerChunkPosition" });
}
