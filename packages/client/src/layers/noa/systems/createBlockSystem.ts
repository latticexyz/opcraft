import { defineComponentSystem, defineEnterSystem, getComponentValueStrict, Has } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export function createBlockSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    api: { setBlock },
  } = context;

  const {
    world,
    components: { Item, Position },
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
  defineEnterSystem(world, [Has(OptimisticPosition), Has(OptimisticItem)], (update) => {
    const position = getComponentValueStrict(OptimisticPosition, update.entity);
    const block = getBlockAtPosition(position);
    setBlock(position, block);
  });
}
