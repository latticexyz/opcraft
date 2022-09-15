// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../MudTest.t.sol";
import { Perlin } from "noise/Perlin.sol";
import { TerrainSystem, ID as TerrainSystemID, VoxelCoord } from "../../systems/TerrainSystem.sol";
import { BlockType } from "../../constants.sol";

contract TerrainSystemTest is MudTest {
  function testExecute() public {
    BlockType blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-327, 21, -603));
    assertEq(uint8(blockType), uint8(BlockType.Stone));

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-377, -1, -632));
    assertEq(uint8(blockType), uint8(BlockType.Water));

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-377, -1, -631));
    assertEq(uint8(blockType), uint8(BlockType.Log));

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-377, 0, -631));
    assertEq(uint8(blockType), uint8(BlockType.Air));

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-571, 0, -703));
    assertEq(uint8(blockType), uint8(BlockType.Grass));

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-573, 0, -708));
    assertEq(uint8(blockType), uint8(BlockType.Sand));
  }
}
