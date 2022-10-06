import { formatEntityID } from "@latticexyz/network";
import { Coord, padToBitLength, toInt32, VoxelCoord } from "@latticexyz/utils";
import { CHUNK } from "../constants";

export function getChunkCoord(voxelCoord: VoxelCoord): Coord {
  return { x: Math.floor(voxelCoord.x / CHUNK), y: Math.floor(voxelCoord.z / CHUNK) };
}

export function getChunkEntity(chunk: Coord) {
  const x = padToBitLength(toInt32(chunk.x).toString(16), 32).substring(2);
  const y = padToBitLength(toInt32(chunk.y).toString(16), 32).substring(2);
  return formatEntityID(`0x${x}${y}`);
}
