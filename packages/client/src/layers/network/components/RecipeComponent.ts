import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineRecipeComponent(world: World) {
  return defineComponent(
    world,
    { value: Type.String },
    {
      id: "Recipe",
      metadata: { contractId: "component.Recipe" },
    }
  );
}
