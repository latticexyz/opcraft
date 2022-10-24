// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/VoxelCoordComponent.sol";

uint256 constant ID = uint256(keccak256("component.Position"));

contract PositionComponent is VoxelCoordComponent {
  constructor(address world) VoxelCoordComponent(world, ID) {}
}
