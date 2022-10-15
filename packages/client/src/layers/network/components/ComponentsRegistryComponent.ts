import { World } from "@latticexyz/recs";
import { defineStringComponent } from "@latticexyz/std-client";

export function defineComponentsRegistryComponent(world: World) {
  return defineStringComponent(world, {
    id: "ComponentsRegistry",
    metadata: { contractId: "world.component.components" },
  });
}
