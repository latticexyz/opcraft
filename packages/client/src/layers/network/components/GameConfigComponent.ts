import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineGameConfigComponent(world: World) {
  return defineComponent(
    world,
    { creativeMode: Type.Boolean },
    {
      id: "GameConfig",
      metadata: { contractId: "component.GameConfig" },
    }
  );
}
