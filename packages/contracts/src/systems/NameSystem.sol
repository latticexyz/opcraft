// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";

uint256 constant ID = uint256(keccak256("system.Name"));

contract NameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 entity, string memory name) = abi.decode(arguments, (uint256, string));

    // Name system can only be called by name oracle
    require(msg.sender == 0x27C41B2D2368085EF6fe7Dd66Cf32EB01e0e0658, "ONLY_ORACLE");

    NameComponent nameComponent = NameComponent(getAddressById(components, NameComponentID));
    nameComponent.set(entity, name);
  }

  function executeTyped(uint256 entity, string memory name) public returns (bytes memory) {
    return execute(abi.encode(entity, name));
  }
}
