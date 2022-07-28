import { defineComponentSystem, defineSystem, getComponentValue, Has } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { BlockType as BlockTypeEnum } from "../constants";
import { NoaLayer } from "../types";

export function createBlockSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    api: { setBlock },
  } = context;

  const {
    world,
    components: { Position, BlockType },
    actions: { withOptimisticUpdates },
  } = network;

  const OptimisticPosition = withOptimisticUpdates(Position);
  const OptimisticBlockType = withOptimisticUpdates(BlockType);

  // "Exit system"
  defineComponentSystem(world, OptimisticPosition, ({ value, entity }) => {
    console.log("block update", value[0], value[1]);
    // TODO: remove the number.max_safe_integer hack
    if (!value[0] && value[1] && entity !== Number.MAX_SAFE_INTEGER) {
      setBlock(value[1], BlockTypeEnum.Air);
    }
  });

  // "Enter system"
  defineSystem(world, [Has(OptimisticPosition), Has(OptimisticBlockType)], (update) => {
    const position = getComponentValue(OptimisticPosition, update.entity);
    const blockType = getComponentValue(OptimisticBlockType, update.entity);

    if (!position || !blockType) return;

    setBlock(position, blockType.value as BlockTypeEnum);
  });
}
