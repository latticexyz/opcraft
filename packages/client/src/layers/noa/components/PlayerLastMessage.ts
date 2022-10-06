import { defineComponent, Type, World } from "@latticexyz/recs";

export function definePlayerLastMessage(world: World) {
  return defineComponent(world, { value: Type.Number }, { id: "PlayerLastMessage" });
}
