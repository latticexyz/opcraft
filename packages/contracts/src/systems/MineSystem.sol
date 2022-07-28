// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PositionComponent, ID as PositionComponentID, VoxelCoord } from "../components/PositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";

uint256 constant ID = uint256(keccak256("ember.system.mine"));

contract MineSystem is System {
  constructor(IUint256Component _components, IWorld _world) System(_components, _world) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    VoxelCoord memory targetPosition = abi.decode(arguments, (VoxelCoord));

    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    uint256 entity = positionComponent.getEntitiesWithValue(targetPosition)[0];
    positionComponent.remove(entity);

    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    ownedByComponent.set(entity, addressToEntity(msg.sender));
  }

  function executeTyped(VoxelCoord memory targetPosition) public returns (bytes memory) {
    return execute(abi.encode(targetPosition));
  }
}
