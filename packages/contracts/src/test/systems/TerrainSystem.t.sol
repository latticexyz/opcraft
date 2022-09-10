// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../MudTest.t.sol";
import { Perlin } from "noise/Perlin.sol";
import { TerrainSystem, ID as TerrainSystemID, VoxelCoord } from "../../systems/TerrainSystem.sol";
import { BlockType } from "../../constants.sol";

contract TerrainSystemTest is MudTest {
  function testExecute() public {
    BlockType blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(82, 41, -13));
    assertEq(uint8(blockType), uint8(BlockType.Grass));

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-76, 4, 19));
    assertEq(uint8(blockType), uint8(BlockType.Sand));

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-126, -10, -45));
    assertEq(uint8(blockType), uint8(BlockType.Sand));

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-76, 5, 19));
    assertEq(uint8(blockType), uint8(BlockType.Air));

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-148, -11, -90));
    assertEq(uint8(blockType), uint8(BlockType.Water));

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-200, -11, -128));
    assertEq(uint8(blockType), uint8(BlockType.Water));
  }
}
