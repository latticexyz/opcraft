// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { Perlin } from "noise/Perlin.sol";

import { PositionComponent, ID as PositionComponentID, VoxelCoord } from "../components/PositionComponent.sol";

struct Coord {
  int32 x;
  int32 y;
}

uint256 constant ID = uint256(keccak256("system.perlin"));

contract PerlinSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public view returns (bytes memory) {
    Coord memory coord = abi.decode(arguments, (Coord));
    int128 perlin = Perlin.noise(coord.x, coord.y, 0, 7, 10);
    return abi.encode(perlin);
  }

  function executeTyped(Coord memory coord) public view returns (int128 perlin) {
    return abi.decode(execute(abi.encode(coord)), (int128));
  }
}
