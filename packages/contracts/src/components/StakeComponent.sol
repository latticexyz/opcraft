// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/Uint32BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Stake"));

contract StakeComponent is Uint32BareComponent {
  constructor(address world) Uint32BareComponent(world, ID) {}
}
