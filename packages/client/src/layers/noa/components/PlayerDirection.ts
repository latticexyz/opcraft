import { defineComponent, Type, World } from "@latticexyz/recs";

export function definePlayerDirectionComponent(world: World) {
  return defineComponent(
    world,
    { qx: Type.Number, qy: Type.Number, qz: Type.Number, qw: Type.Number },
    { id: "PlayerDirection" }
  );
}
