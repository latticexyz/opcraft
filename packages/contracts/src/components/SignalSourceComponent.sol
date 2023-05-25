// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "std-contracts/components/BoolComponent.sol";

import { BlockDirection } from "../types.sol";

uint256 constant ID = uint256(keccak256("component.SignalSource"));

contract SignalSourceComponent is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}

  function set(uint256 entity, bool isNatural) public {
    set(entity, abi.encode(isNatural));
  }
}
