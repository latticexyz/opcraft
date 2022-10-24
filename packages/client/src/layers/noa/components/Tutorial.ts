import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineTutorialComponent(world: World) {
  return defineComponent(
    world,
    {
      community: Type.Boolean,
      mine: Type.Boolean,
      build: Type.Boolean,
      craft: Type.Boolean,
      claim: Type.Boolean,
      inventory: Type.Boolean,
      moving: Type.Boolean,
      teleport: Type.Boolean,
    },
    { id: "Tutorial" }
  );
}
