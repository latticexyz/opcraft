import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineUIComponent(world: World) {
  return defineComponent(
    world,
    { height: Type.Boolean, terrain: Type.Boolean, activity: Type.Boolean },
    { id: "UIComponent" }
  );
}
