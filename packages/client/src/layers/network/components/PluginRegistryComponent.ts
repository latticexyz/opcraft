import { World } from "@latticexyz/recs";
import { defineStringComponent } from "@latticexyz/std-client";

export function definePluginRegistryComponent(world: World) {
  return defineStringComponent(world, {
    id: "PluginRegistry",
    metadata: { contractId: "component.PluginRegistry" },
  });
}
