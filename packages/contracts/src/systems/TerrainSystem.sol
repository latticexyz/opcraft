// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { VoxelCoord } from "std-contracts/components/VoxelCoordComponent.sol";
import { LibTerrain } from "../libraries/LibTerrain.sol";

uint256 constant ID = uint256(keccak256("system.terrain"));

contract TerrainSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public view returns (bytes memory) {
    VoxelCoord memory coord = abi.decode(arguments, (VoxelCoord));
    return abi.encode(LibTerrain.getTerrainBlock(coord));
  }

  function executeTyped(VoxelCoord memory coord) public view returns (uint256) {
    return abi.decode(execute(abi.encode(coord)), (uint256));
  }
}
