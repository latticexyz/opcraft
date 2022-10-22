import { defineComponent, Type, World } from "@latticexyz/recs";
import { defineStringComponent } from "@latticexyz/std-client";

export function definePluginComponent(world: World) {
  return defineComponent(
    world,
    {
      host: Type.String,
      source: Type.String,
      path: Type.String,
      active: Type.Boolean,
    },
    {
      id: "Plugin",
      metadata: { contractId: "component.Plugin" },
    }
  );
}
