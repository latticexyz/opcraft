// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { CHUNK } from "./constants.sol";
import { Coord, VoxelCoord, BlockDirection } from "./types.sol";

// Divide with rounding down like Math.floor(a/b), not rounding towards zero
function div(int32 a, int32 b) pure returns (int32) {
  int32 result = a / b;
  int32 floor = (a < 0 || b < 0) && !(a < 0 && b < 0) && (a % b != 0) ? int32(1) : int32(0);
  return result - floor;
}

function getChunkCoord(VoxelCoord memory coord) pure returns (Coord memory) {
  return Coord(div(coord.x, CHUNK), div(coord.z, CHUNK));
}

function initializeArray(uint256 x, uint256 y) pure returns (uint256[][] memory) {
  uint256[][] memory arr = new uint256[][](x);
  for (uint256 i; i < x; i++) {
    arr[i] = new uint256[](y);
  }
  return arr;
}

function calculateBlockDirection(VoxelCoord memory centerCoord, VoxelCoord memory neighborCoord)
  pure
  returns (BlockDirection)
{
  if (neighborCoord.x == centerCoord.x && neighborCoord.y == centerCoord.y && neighborCoord.z == centerCoord.z) {
    return BlockDirection.None;
  } else if (neighborCoord.y > centerCoord.y) {
    return BlockDirection.Up;
  } else if (neighborCoord.y < centerCoord.y) {
    return BlockDirection.Down;
  } else if (neighborCoord.z > centerCoord.z) {
    return BlockDirection.North;
  } else if (neighborCoord.z < centerCoord.z) {
    return BlockDirection.South;
  } else if (neighborCoord.x > centerCoord.x) {
    return BlockDirection.East;
  } else if (neighborCoord.x < centerCoord.x) {
    return BlockDirection.West;
  } else {
    return BlockDirection.None;
  }
}

function getOppositeDirection(BlockDirection direction) pure returns (BlockDirection) {
  if (direction == BlockDirection.None) {
    return BlockDirection.None;
  } else if (direction == BlockDirection.Up) {
    return BlockDirection.Down;
  } else if (direction == BlockDirection.Down) {
    return BlockDirection.Up;
  } else if (direction == BlockDirection.North) {
    return BlockDirection.South;
  } else if (direction == BlockDirection.South) {
    return BlockDirection.North;
  } else if (direction == BlockDirection.East) {
    return BlockDirection.West;
  } else if (direction == BlockDirection.West) {
    return BlockDirection.East;
  } else {
    return BlockDirection.None;
  }
}

function getVoxelCoordInDirection(
  VoxelCoord memory coord,
  BlockDirection direction,
  int32 distance
) pure returns (VoxelCoord memory) {
  VoxelCoord memory newCoord = VoxelCoord(coord.x, coord.y, coord.z);

  if (direction == BlockDirection.Up) {
    newCoord.y += distance;
  } else if (direction == BlockDirection.Down) {
    newCoord.y -= distance;
  } else if (direction == BlockDirection.North) {
    newCoord.z += distance;
  } else if (direction == BlockDirection.South) {
    newCoord.z -= distance;
  } else if (direction == BlockDirection.East) {
    newCoord.x += distance;
  } else if (direction == BlockDirection.West) {
    newCoord.x -= distance;
  }

  return newCoord;
}

function hasEntity(uint256[] memory entities) pure returns (bool) {
  for (uint8 i; i < entities.length; i++) {
    if (entities[i] != 0) {
      return true;
    }
  }
  return false;
}
