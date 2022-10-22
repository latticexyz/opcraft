import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineUIComponent(world: World) {
  return defineComponent(
    world,
    {
      showComponentBrowser: Type.Boolean,
      showInventory: Type.Boolean,
      showCrafting: Type.Boolean,
      showPlugins: Type.Boolean,
    },
    { id: "UI" }
  );
}
