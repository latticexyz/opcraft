// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";

uint256 constant ID = uint256(keccak256("system.Transfer"));

contract TransferSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 item, uint256 receiver) = abi.decode(arguments, (uint256, uint256));

    // Initialize components
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));

    // Require block to be owned by caller
    require(ownedByComponent.getValue(item) == addressToEntity(msg.sender), "block is not owned by sender");

    // Transfer ownership of the item
    ownedByComponent.set(item, receiver);
  }

  function executeTyped(uint256 item, uint256 receiver) public returns (bytes memory) {
    return execute(abi.encode(item, receiver));
  }
}
