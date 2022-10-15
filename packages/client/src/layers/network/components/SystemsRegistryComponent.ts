import { World } from "@latticexyz/recs";
import { defineStringComponent } from "@latticexyz/std-client";

export function defineSystemsRegistryComponent(world: World) {
  return defineStringComponent(world, {
    id: "SystemsRegistry",
    metadata: { contractId: "world.component.systems" },
  });
}
