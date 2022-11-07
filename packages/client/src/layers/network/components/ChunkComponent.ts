import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineChunkComponent(world: World) {
  return defineComponent(
    world,
    {
      changes: Type.Number,
    },
    {
      id: "Chunk",
      metadata: { contractId: "component.Chunk" },
    }
  );
}
