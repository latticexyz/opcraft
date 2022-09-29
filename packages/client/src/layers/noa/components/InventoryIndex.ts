import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineInventoryIndexComponent(world: World) {
  return defineComponent(world, { value: Type.Number }, { id: "InventoryIndex" });
}
