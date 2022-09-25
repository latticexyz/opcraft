// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";

uint256 constant ID = uint256(keccak256("system.Name"));

contract NameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    string memory name = abi.decode(arguments, (string));

    NameComponent nameComponent = NameComponent(getAddressById(components, NameComponentID));
    nameComponent.set(addressToEntity(msg.sender), name);
  }

  function executeTyped(string memory name) public returns (bytes memory) {
    return execute(abi.encode(name));
  }
}
