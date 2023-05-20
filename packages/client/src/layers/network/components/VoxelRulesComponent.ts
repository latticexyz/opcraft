import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineVoxelRulesComponent(world: World) {
  return defineComponent(
    world,
    { value: Type.NumberArray },
    {
      id: "VoxelRules",
      metadata: { contractId: "component.VoxelRules" },
    }
  );
}
