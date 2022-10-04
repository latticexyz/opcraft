import { defineComponent, Type, World } from "@latticexyz/recs";

export function definePlayerDirectionComponent(world: World) {
  return defineComponent(world, { pitch: Type.Number, yaw: Type.Number }, { id: "PlayerDirection" });
}
