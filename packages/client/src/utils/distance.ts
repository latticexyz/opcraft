import { VoxelCoord } from "@latticexyz/utils";

/**
 * @param a Coordinate A
 * @param b Coordinate B
 * @returns L2 distance from A to B
 */
export function l2(a: VoxelCoord, b: VoxelCoord) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}
