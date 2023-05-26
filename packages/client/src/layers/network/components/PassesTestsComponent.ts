import { defineComponent, Type, World } from "@latticexyz/recs";

export function definePassesTestsComponent(world: World) {
  return defineComponent(
    world,
    { value: Type.StringArray }, // string array since js numbers can't hold uint256
    {
      id: "PassesTests",
      metadata: { contractId: "component.PassesTests" },
    }
  );
}
