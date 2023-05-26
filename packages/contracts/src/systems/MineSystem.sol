// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { TypeComponent, ID as TypeComponentID } from "../components/TypeComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../components/ItemComponent.sol";
import { SignalComponent, ID as SignalComponentID, SignalData } from "../components/SignalComponent.sol";
import { SignalSourceComponent, ID as SignalSourceComponentID } from "../components/SignalSourceComponent.sol";
import { OccurrenceComponent, ID as OccurrenceComponentID, staticcallFunctionSelector } from "../components/OccurrenceComponent.sol";
import { ClaimComponent, ID as ClaimComponentID, Claim } from "../components/ClaimComponent.sol";
import { getClaimAtCoord } from "../systems/ClaimSystem.sol";
import { AirID, WaterID, WoolID, SandID, BlueFlowerID } from "../prototypes/Blocks.sol";
import { VoxelCoord, BlockDirection } from "../types.sol";
import { BlockInteraction } from "../libraries/BlockInteraction.sol";
import { CreateBlock } from "../libraries/CreateBlock.sol";

uint256 constant ID = uint256(keccak256("system.Mine"));

contract MineSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (VoxelCoord memory coord, uint256 blockType) = abi.decode(arguments, (VoxelCoord, uint256));
    require(blockType != AirID, "can not mine air");
    require(blockType != WaterID, "can not mine water");
    require(coord.y < 256 && coord.y >= -63, "out of chunk bounds");

    // Initialize components
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));
    OccurrenceComponent occurrenceComponent = OccurrenceComponent(getAddressById(components, OccurrenceComponentID));
    ClaimComponent claimComponent = ClaimComponent(getAddressById(components, ClaimComponentID));

    // Check claim in chunk
    uint256 claimer = getClaimAtCoord(claimComponent, coord).claimer;
    require(claimer == 0 || claimer == addressToEntity(msg.sender), "can not mine in claimed chunk");

    // Check ECS blocks at coord
    uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(coord);

    uint256 entity;
    // TODO: Figure out how to not do this
    uint256 airEntity;

    if (entitiesAtPosition.length == 0) {
      // If there is no entity at this position, try mining the terrain block at this position
      (bool success, bytes memory occurrence) = staticcallFunctionSelector(
        occurrenceComponent.getValue(blockType),
        abi.encode(coord)
      );
      require(
        success && occurrence.length > 0 && abi.decode(occurrence, (uint256)) == blockType,
        "invalid terrain block type"
      );

      // Create an ECS block from this coord's terrain block
      entity = world.getUniqueEntityId();
      itemComponent.set(entity, blockType);

      // Place an air block at this position
      airEntity = world.getUniqueEntityId();
      itemComponent.set(airEntity, AirID);
      positionComponent.set(airEntity, coord);
    } else {
      // Else, mine the non-air entity block at this position
      for (uint256 i; i < entitiesAtPosition.length; i++) {
        if (itemComponent.getValue(entitiesAtPosition[i]) == blockType) entity = entitiesAtPosition[i];
      }
      require(entity != 0, "invalid block type");
      positionComponent.remove(entity);

      // TODO: Figure out how to not do this
      // Place an air block at this position so BlockInteraction can use this position
      airEntity = world.getUniqueEntityId();
      itemComponent.set(airEntity, AirID);
      positionComponent.set(airEntity, coord);
    }

    TypeComponent(getAddressById(components, TypeComponentID)).set(entity, blockType);
    ownedByComponent.set(entity, addressToEntity(msg.sender));

    // TODO: Remove this once we have a proper inventory system
    CreateBlock.addCustomComponents(components, blockType, entity);

    // Run block interaction logic
    BlockInteraction.runInteractionSystems(world.systems(), components, airEntity);

    return abi.encode(entity);
  }

  function executeTyped(VoxelCoord memory coord, uint256 blockType) public returns (uint256 minedEntity) {
    return abi.decode(execute(abi.encode(coord, blockType)), (uint256));
  }
}
