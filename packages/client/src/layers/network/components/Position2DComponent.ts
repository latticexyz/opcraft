import { World } from "@latticexyz/recs";
import { defineCoordComponent } from "@latticexyz/std-client";

export function definePosition2DComponent(world: World) {
  return defineCoordComponent(world, {
    id: "Position2D",
    metadata: { contractId: "component.Position2D" },
  });
}
