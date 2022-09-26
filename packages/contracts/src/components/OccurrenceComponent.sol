// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "std-contracts/components/FunctionComponent.sol";

uint256 constant ID = uint256(keccak256("component.Occurrence"));

contract OccurrenceComponent is FunctionComponent {
  constructor(address world) FunctionComponent(world, ID) {}
}
