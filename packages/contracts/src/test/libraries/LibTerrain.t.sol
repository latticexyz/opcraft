// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { DSTest } from "ds-test/test.sol";
import { LibTerrain } from "../../libraries/LibTerrain.sol";
import { VoxelCoord } from "../../types.sol";

contract LibTerrainTest is DSTest {
  function testGetTerrainBlock() public pure {
    LibTerrain.getTerrainBlock(VoxelCoord(10, 10, 10));
  }
}
