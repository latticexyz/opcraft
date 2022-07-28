import { World } from "@latticexyz/recs";
import { defineNumberComponent } from "@latticexyz/std-client";

export function defineSelectedSlotComponent(world: World) {
  return defineNumberComponent(world, { id: "SelectedSlot" });
}
