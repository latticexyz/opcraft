// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.Recipe"));

// Recipe is hash of uint256[][]
contract RecipeComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
