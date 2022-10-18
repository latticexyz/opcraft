import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineTutorialComponent(world: World) {
  return defineComponent(
    world,
    {
      community: Type.Boolean,
    },
    { id: "Tutorial" }
  );
}
