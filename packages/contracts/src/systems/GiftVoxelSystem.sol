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
import { OccurrenceComponent, ID as OccurrenceComponentID, staticcallFunctionSelector } from "../components/OccurrenceComponent.sol";
import { ClaimComponent, ID as ClaimComponentID, Claim } from "../components/ClaimComponent.sol";
import { getClaimAtCoord } from "../systems/ClaimSystem.sol";
import { AirID, WaterID } from "../prototypes/Blocks.sol";
import { VoxelCoord } from "../types.sol";

uint256 constant ID = uint256(keccak256("system.GiftVoxel"));

contract GiftVoxelSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 voxelType = abi.decode(arguments, (uint256));
    // Initialize components
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));
    TypeComponent typeComponent = TypeComponent(getAddressById(components, TypeComponentID));

    uint256 entity = world.getUniqueEntityId();
    typeComponent.set(entity, voxelType);
    itemComponent.set(entity, voxelType); // not sure if this will break or not

    ownedByComponent.set(entity, addressToEntity(msg.sender));
    return abi.encode(entity);
  }

  function executeTyped(uint256 voxelType) public returns (uint256 giftedEntity) {
    return abi.decode(execute(abi.encode(voxelType)), (uint256));
  }
}
