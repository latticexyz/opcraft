import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineOccurrenceComponent(world: World) {
  return defineComponent(
    world,
    { contr: Type.String, func: Type.String },
    {
      id: "Occurrence",
      metadata: { contractId: "component.Occurrence" },
    }
  );
}
