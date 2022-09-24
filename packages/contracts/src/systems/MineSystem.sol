// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PositionComponent, ID as PositionComponentID, VoxelCoord } from "../components/PositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../components/ItemComponent.sol";
import { LibTerrain } from "../libraries/LibTerrain.sol";

import { AirID, WaterID } from "../prototypes/Blocks.sol";

uint256 constant ID = uint256(keccak256("system.Mine"));

// TODO: Min/Max chunk height
contract MineSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (VoxelCoord memory targetPosition, uint256 blockType) = abi.decode(arguments, (VoxelCoord, uint256));
    require(blockType != AirID, "can not mine air");
    require(blockType != WaterID, "can not mine water");

    // Initialize components
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));

    uint256 entity;

    // Check ECS blocks at coord
    uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(targetPosition);

    if (entitiesAtPosition.length == 0) {
      // If there is no entity at this position, try mining the terrain block at this position
      require(LibTerrain.getTerrainBlock(targetPosition) == blockType, "invalid terrain block type");

      // Create an ECS block from this coord's terrain block
      entity = world.getUniqueEntityId();
      itemComponent.set(entity, blockType);

      // Place an air block at this position
      uint256 airEntity = world.getUniqueEntityId();
      itemComponent.set(airEntity, AirID);
      positionComponent.set(airEntity, targetPosition);
    } else {
      // Else, mine the non-air entity block at this position
      for (uint256 i; i < entitiesAtPosition.length; i++) {
        if (itemComponent.getValue(entitiesAtPosition[i]) == blockType) entity = entitiesAtPosition[i];
      }
      require(entity != 0, "invalid block type");
      positionComponent.remove(entity);
    }

    ownedByComponent.set(entity, addressToEntity(msg.sender));
  }

  function executeTyped(VoxelCoord memory targetPosition, uint256 blockType) public returns (bytes memory) {
    return execute(abi.encode(targetPosition, blockType));
  }
}
