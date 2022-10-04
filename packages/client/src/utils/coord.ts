import { VoxelCoord } from "@latticexyz/utils";

export const ZERO_VECTOR: VoxelCoord = { x: 0, y: 0, z: 0 };

export function eq(a: VoxelCoord, b: VoxelCoord): boolean {
  if (a.x !== b.x || a.y !== b.y || a.z !== b.z) {
    return false;
  }
  return true;
}
export function mul(a: VoxelCoord, b: number): VoxelCoord {
  return { x: a.x * b, y: a.y * b, z: a.z * b };
}

export function add(a: VoxelCoord, b: VoxelCoord): VoxelCoord {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: VoxelCoord, b: VoxelCoord): VoxelCoord {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
