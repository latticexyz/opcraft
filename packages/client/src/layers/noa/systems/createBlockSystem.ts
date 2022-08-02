import { defineComponentSystem, defineSystem, getComponentValue, Has } from "@latticexyz/recs";
import { NetworkLayer, BlockType as BlockTypeEnum } from "../../network";
import { NoaLayer } from "../types";

export function createBlockSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    api: { setBlock, getVoxel },
  } = context;

  const {
    world,
    components: { Position, BlockType },
    actions: { withOptimisticUpdates },
  } = network;

  const OptimisticPosition = withOptimisticUpdates(Position);
  const OptimisticBlockType = withOptimisticUpdates(BlockType);

  // "Exit system"
  defineComponentSystem(world, OptimisticPosition, ({ value }) => {
    if (!value[0] && value[1]) {
      const voxel = getVoxel(value[1]);
      setBlock(value[1], voxel);
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
