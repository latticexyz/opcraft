// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PositionComponent, ID as PositionComponentID, VoxelCoord } from "../components/PositionComponent.sol";
import { BlockTypeComponent, ID as BlockTypeComponentID } from "../components/BlockTypeComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID, GameConfig } from "../components/GameConfigComponent.sol";
import { BlockType, GodID } from "../constants.sol";

uint256 constant ID = uint256(keccak256("ember.system.build"));

contract BuildSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 blockEntity, VoxelCoord memory targetPosition, BlockType blockType) = abi.decode(
      arguments,
      (uint256, VoxelCoord, BlockType)
    );

    GameConfigComponent gameConfigComponent = GameConfigComponent(getAddressById(components, GameConfigComponentID));
    bool creativeMode = gameConfigComponent.getValue(GodID).creativeMode;

    BlockTypeComponent blockTypeComponent = BlockTypeComponent(getAddressById(components, BlockTypeComponentID));

    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));

    if (creativeMode) {
      // Create a new block in creative mode
      if (blockEntity == 0) blockEntity = world.getUniqueEntityId();
      blockTypeComponent.set(blockEntity, uint32(blockType));
    } else {
      require(ownedByComponent.getValue(blockEntity) == addressToEntity(msg.sender), "block is not owned by player");
      // This check would not be necessary if we used a different system for building in non-creative mode that doesn't require passing the block type
      require(blockTypeComponent.getValue(blockEntity) == uint32(blockType), "block type does not match");
    }

    ownedByComponent.set(blockEntity, GodID);

    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    positionComponent.set(blockEntity, targetPosition);
  }

  function executeTyped(
    uint256 entity,
    VoxelCoord memory targetPosition,
    BlockType blockType
  ) public returns (bytes memory) {
    return execute(abi.encode(entity, targetPosition, blockType));
  }
}
