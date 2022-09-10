// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { TerrainSystem, ID as TerrainSystemID } from "../systems/TerrainSystem.sol";

import { PositionComponent, ID as PositionComponentID, VoxelCoord } from "../components/PositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { BlockTypeComponent, ID as BlockTypeComponentID } from "../components/BlockTypeComponent.sol";
import { BlockType } from "../constants.sol";

uint256 constant ID = uint256(keccak256("ember.system.mine"));

contract MineSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (VoxelCoord memory targetPosition, BlockType blockType) = abi.decode(arguments, (VoxelCoord, BlockType));
    require(blockType != BlockType.Air, "can not mine air");

    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    BlockTypeComponent blockTypeComponent = BlockTypeComponent(getAddressById(components, BlockTypeComponentID));

    TerrainSystem terrainSystem = TerrainSystem(getAddressById(world.systems(), TerrainSystemID));

    uint256 entity;
    uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(targetPosition);

    if (entitiesAtPosition.length == 0) {
      // If there is no entity at this position, try mining the terrain block at this position
      require(terrainSystem.executeTyped(targetPosition) == blockType, "invalid terrain block type");
      entity = world.getUniqueEntityId();
      blockTypeComponent.set(entity, uint32(blockType));

      // Set an air block at this position
      uint256 airEntity = world.getUniqueEntityId();
      blockTypeComponent.set(airEntity, uint32(BlockType.Air));
      positionComponent.set(airEntity, targetPosition);
    } else {
      // Else, mine the entity block at this position
      entity = entitiesAtPosition[0];
      require(blockTypeComponent.getValue(entity) == uint32(blockType), "invalid block type");
      positionComponent.remove(entity);
    }

    ownedByComponent.set(entity, addressToEntity(msg.sender));
  }

  function executeTyped(VoxelCoord memory targetPosition, uint32 blockType) public returns (bytes memory) {
    return execute(abi.encode(targetPosition, blockType));
  }
}
