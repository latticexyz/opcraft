import { World } from "@latticexyz/recs";
import { defineBoolComponent } from "@latticexyz/std-client";

export function defineItemPrototypeComponent(world: World) {
  return defineBoolComponent(world, {
    id: "ItemPrototype",
    metadata: { contractId: "component.ItemPrototype" },
  });
}
