import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineClaimComponent(world: World) {
  return defineComponent(
    world,
    { stake: Type.Number, claimer: Type.Entity },
    {
      id: "Claim",
      metadata: { contractId: "component.Claim" },
    }
  );
}
