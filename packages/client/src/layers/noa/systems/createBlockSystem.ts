import { defineComponentSystem, defineSystem, EntityID, getComponentValue, Has } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export function createBlockSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    api: { setBlock },
  } = context;

  const {
    world,
    components: { Position, Item },
    actions: { withOptimisticUpdates },
    api: { getBlockAtPosition },
  } = network;

  const OptimisticPosition = withOptimisticUpdates(Position);
  const OptimisticItem = withOptimisticUpdates(Item);

  // "Exit system"
  defineComponentSystem(world, OptimisticPosition, async ({ value }) => {
    if (!value[0] && value[1]) {
      const block = getBlockAtPosition(value[1]);
      setBlock(value[1], block);
    }
  });

  // "Enter system"
  defineSystem(world, [Has(OptimisticPosition), Has(OptimisticItem)], (update) => {
    const position = getComponentValue(OptimisticPosition, update.entity);
    const item = getComponentValue(OptimisticItem, update.entity);

    if (!position || !item) {
      return console.warn("no position/item for this update", update, position, item);
    }

    setBlock(position, item.value as EntityID);
  });
}
