// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import { VoxelCoord } from "std-contracts/components/VoxelCoordComponent.sol";

struct Coord {
  int32 x;
  int32 y;
}

struct TransitionRule {
  string lookFor; // the name of the voxel to look for
  string changeTo; // the name of the voxel to change to
}
