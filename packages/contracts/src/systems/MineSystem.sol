// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PositionComponent, ID as PositionComponentID, VoxelCoord } from "../components/PositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { BlockTypeComponent, ID as BlockTypeComponentID } from "../components/BlockTypeComponent.sol";
import { BlockType } from "../constants.sol";

uint256 constant ID = uint256(keccak256("ember.system.mine"));

contract MineSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (VoxelCoord memory targetPosition, uint32 blockType) = abi.decode(arguments, (VoxelCoord, uint32));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    BlockTypeComponent blockTypeComponent = BlockTypeComponent(getAddressById(components, BlockTypeComponentID));

    uint256 entity;

    if (blockType == 0) {
      entity = positionComponent.getEntitiesWithValue(targetPosition)[0];
      positionComponent.remove(entity);
    } else {
      entity = world.getUniqueEntityId();
      blockTypeComponent.set(entity, blockType);

      uint256 airEntity = world.getUniqueEntityId();
      blockTypeComponent.set(airEntity, uint32(BlockType.Air));
      positionComponent.set(airEntity, targetPosition);
    }

    ownedByComponent.set(entity, addressToEntity(msg.sender));
  }

  function executeTyped(VoxelCoord memory targetPosition, uint32 blockType) public returns (bytes memory) {
    return execute(abi.encode(targetPosition, blockType));
  }
}
