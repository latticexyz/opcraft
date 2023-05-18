// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/Uint256ArrayBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.VoxelRules"));

// maps the voxelId -> its rules
contract VoxelRulesComponent is Uint256ArrayBareComponent {
  constructor(address world) Uint256ArrayBareComponent(world, ID) {}
}
