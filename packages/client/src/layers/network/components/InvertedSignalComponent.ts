import { World, Type, defineComponent } from "@latticexyz/recs";

export function defineInvertedSignalComponent(world: World) {
  return defineComponent(
    world,
    {
      isActive: Type.Boolean,
      direction: Type.Number, // TODO: should map to an enum
    },
    {
      id: "InvertedSignal",
      metadata: { contractId: "component.InvertedSignal" },
    }
  );
}
