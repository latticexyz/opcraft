import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineRecipeComponent(world: World) {
  return defineComponent(
    world,
    { value: Type.NumberArray },
    {
      id: "Recipe",
      metadata: { contractId: "ember.component.recipe" },
    }
  );
}
