import { World, Type, defineComponent } from "@latticexyz/recs";

export function defineSignalComponent(world: World) {
  return defineComponent(
    world,
    {
      isActive: Type.Boolean,
      direction: Type.Number, // TODO: should map to an enum
    },
    {
      id: "Signal",
      metadata: { contractId: "component.Signal" },
    }
  );
}
