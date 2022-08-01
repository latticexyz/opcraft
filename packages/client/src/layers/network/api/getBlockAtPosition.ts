import { Component, getComponentValueStrict, Has, HasValue, runQuery, Type } from "@latticexyz/recs";
import { VoxelCoord } from "@latticexyz/utils";
import { BlockType as BlockTypeEnum } from "../constants";

export function getBlockAtPosition(
  context: {
    Position: Component<{ x: Type.Number; y: Type.Number; z: Type.Number }>;
    BlockType: Component<{ value: Type.Number }>;
  },
  coord: VoxelCoord
) {
  const { Position, BlockType } = context;

  if (coord.y < 0) {
    return BlockTypeEnum.Water;
  }

  const block = [...runQuery([HasValue(Position, coord), Has(BlockType)])][0];
  if (block != null) return getComponentValueStrict(BlockType, block).value;
  return BlockTypeEnum.Air;
}
