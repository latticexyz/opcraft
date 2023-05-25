import { World } from "@latticexyz/recs";
import { defineBoolComponent } from "@latticexyz/std-client";

export function defineSignalSourceComponent(world: World) {
  return defineBoolComponent(world, {
    metadata: {
      contractId: "component.SignalSource",
    },
  });
}
