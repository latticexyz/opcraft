import { defineComponent, Type, World } from "@latticexyz/recs";

export function definePlayerLastMessge(world: World) {
  return defineComponent(world, { value: Type.Number }, { id: "PlayerLastMessage" });
}
