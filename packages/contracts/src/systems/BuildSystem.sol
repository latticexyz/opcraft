// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { ClaimComponent, ID as ClaimComponentID, Claim } from "../components/ClaimComponent.sol";
import { TypeComponent, ID as TypeComponentID } from "../components/TypeComponent.sol";
import { getClaimAtCoord } from "../systems/ClaimSystem.sol";
import { VoxelCoord } from "../types.sol";
import { AirID } from "../prototypes/Blocks.sol";

uint256 constant ID = uint256(keccak256("system.Build"));

contract BuildSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 blockEntity, VoxelCoord memory coord) = abi.decode(arguments, (uint256, VoxelCoord));

    // Initialize components
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    ClaimComponent claimComponent = ClaimComponent(getAddressById(components, ClaimComponentID));
    // TODO: specify the type of the block we just placed when building
    // TypeComponent typeComponent = TypeComponent(getAddressById(components, TypeComponentID));

    // Require block to be owned by caller
    require(ownedByComponent.getValue(blockEntity) == addressToEntity(msg.sender), "block is not owned by player");

    // Require no other ECS blocks at this position except Air
    uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(coord);
    require(entitiesAtPosition.length == 0 || entitiesAtPosition.length == 1, "can not built at non-empty coord");
    if (entitiesAtPosition.length == 1) {
      ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));
      require(itemComponent.getValue(entitiesAtPosition[0]) == AirID, "can not built at non-empty coord (2)");
    }

    // Check claim in chunk
    uint256 claimer = getClaimAtCoord(claimComponent, coord).claimer;
    require(claimer == 0 || claimer == addressToEntity(msg.sender), "can not build in claimed chunk");

    // Remove block from inventory and place it in the world
    ownedByComponent.remove(blockEntity);
    positionComponent.set(blockEntity, coord);
  }

  function executeTyped(uint256 entity, VoxelCoord memory coord) public returns (bytes memory) {
    return execute(abi.encode(entity, coord));
  }
}
