// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.ItemPrototype"));

contract ItemPrototypeComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
