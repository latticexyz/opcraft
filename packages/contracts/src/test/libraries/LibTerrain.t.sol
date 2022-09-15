// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { DSTest } from "ds-test/test.sol";
import { LibTerrain } from "../../libraries/LibTerrain.sol";
import { VoxelCoord } from "std-contracts/components/VoxelCoordComponent.sol";

contract LibTerrainTest is DSTest {
  function testGaslimit() public {
    LibTerrain.getTerrainBlock(VoxelCoord(10, 10, 10));
  }
}
