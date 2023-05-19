// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/StringComponent.sol";

uint256 constant ID = uint256(keccak256("component.Type"));

contract TypeComponent is StringComponent {
  constructor(address world) StringComponent(world, ID) {}
}
