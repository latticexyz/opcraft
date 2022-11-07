import { NetworkLayer } from "../types";
import { itemTypes } from "../../../../data/itemTypes.json";
import positionData from "../../../../data/positionsPerItem.json";
import { createEntity, withValue } from "@latticexyz/recs";

export function createInitSystem(context: NetworkLayer) {
  const {
    world,
    components: { Position, Position2D, Item },
  } = context;

  const items = new Map<number, string>(itemTypes.map(([id, num]) => [num, id] as [number, string]));

  for (const [itemIndex, positions] of (positionData as any).positionsPerItem) {
    const item = items.get(itemIndex);
    if (!item) {
      console.error("Unknown item type", itemIndex);
      continue;
    }
    for (const [x, y, z] of positions as [number, number, number][]) {
      createEntity(world, [
        withValue(Position, { x, y, z }),
        withValue(Position2D, { x, y: z }),
        withValue(Item, { value: item }),
      ]);
    }
  }
}
