// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { Perlin } from "noise/Perlin.sol";
import { VoxelCoord } from "std-contracts/components/VoxelCoordComponent.sol";
import { ABDKMath64x64 as Math } from "abdk-libraries-solidity/ABDKMath64x64.sol";

import { PositionComponent, ID as PositionComponentID, VoxelCoord } from "../components/PositionComponent.sol";
import { BlockType } from "../constants.sol";
import { console } from "forge-std/console.sol";

uint256 constant ID = uint256(keccak256("system.terrain"));
int256 constant DENOM = 2**64;

contract TerrainSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public view returns (bytes memory) {
    VoxelCoord memory coord = abi.decode(arguments, (VoxelCoord));

    int128 perlinValue = 0;

    // Continentalness
    perlinValue += Perlin.noise(coord.x, coord.z, 0, 1000, 64) * 10;

    // Erosion
    perlinValue += Perlin.noise(coord.x * DENOM, coord.z * DENOM, perlinValue, 200 * DENOM, 64) * 5;

    // Peaks & Valeys
    perlinValue += Perlin.noise(coord.x * DENOM, coord.z * DENOM, perlinValue, 49 * DENOM, 64);

    // perlinValue / 16 * 255 - 100
    perlinValue = Math.sub(Math.mul(perlinValue, Math.fromUInt(16)), Math.fromUInt(100));
    int64 height = Math.toInt(perlinValue);

    if (coord.y < height) {
      if (coord.y < 5) return abi.encode(BlockType.Sand);
      return abi.encode(BlockType.Grass);
    }

    if (coord.y < -10) {
      return abi.encode(BlockType.Water);
    }

    return abi.encode(BlockType.Air);
  }

  function executeTyped(VoxelCoord memory coord) public view returns (BlockType) {
    return abi.decode(execute(abi.encode(coord)), (BlockType));
  }
}
