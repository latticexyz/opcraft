import { World } from "@latticexyz/recs";
import { defineBoolComponent } from "@latticexyz/std-client";

export function definePlayerMeshComponent(world: World) {
  return defineBoolComponent(world, { id: "PlayerMesh" });
}
