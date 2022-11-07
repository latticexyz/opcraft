import { formatEntityID } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
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

export function getChunkCoordFromEntityId(id: EntityID): Coord {
  let x: number;
  const xLength = Math.max(id.length - 8, 0);

  if (id.length < 10) {
    x = 0;
  } else {
    const xHex = id.substring(2, xLength);
    x = parseInt(xHex, 16) >> 0;
  }

  const yHex = id.substring(xLength);
  const y = parseInt(yHex, 16) >> 0;

  return { x, y };
}
