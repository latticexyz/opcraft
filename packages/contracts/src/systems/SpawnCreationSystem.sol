// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../components/ItemComponent.sol";
import { TypeComponent, ID as TypeComponentID } from "../components/TypeComponent.sol";
import { ClaimComponent, ID as ClaimComponentID, Claim } from "../components/ClaimComponent.sol";
import { MineSystem, ID as MineSystemID } from "./MineSystem.sol";
import { VoxelsComponent, ID as VoxelsComponentID } from "../components/VoxelsComponent.sol";
import { TypeComponent, ID as TypeComponentID } from "../components/TypeComponent.sol";
import { getClaimAtCoord } from "../systems/ClaimSystem.sol";
import { VoxelCoord } from "../types.sol";
import { AirID } from "../prototypes/Blocks.sol";
import { BlockInteraction } from "../libraries/BlockInteraction.sol";
import { SignalComponent, ID as SignalComponentID, SignalData } from "../components/SignalComponent.sol";
import { SignalSourceComponent, ID as SignalSourceComponentID } from "../components/SignalSourceComponent.sol";
import { CreateBlock } from "../libraries/CreateBlock.sol";

uint256 constant ID = uint256(keccak256("system.SpawnCreation"));

contract SpawnCreationSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 creationId, VoxelCoord memory lowerSouthWestCorner) = abi.decode(arguments, (uint256, VoxelCoord));

    // Initialize components
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));
    TypeComponent typeComponent = TypeComponent(getAddressById(components, TypeComponentID));
    VoxelsComponent voxelsComponent = VoxelsComponent(getAddressById(components, VoxelsComponentID));

    // I commented the below cause I will just overwrite all blocks in the region cause I don't want grass messing things up
    // Require no other ECS blocks at this position except Air
    // uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(coord);
    // require(entitiesAtPosition.length == 0 || entitiesAtPosition.length == 1, "can not built at non-empty coord");
    // if (entitiesAtPosition.length == 1) {
    //   require(itemComponent.getValue(entitiesAtPosition[0]) == AirID, "can not built at non-empty coord (2)");
    // }
    uint256[] memory creationVoxelIds = voxelsComponent.getValue(creationId);
    copyVoxels(typeComponent, itemComponent, positionComponent, creationVoxelIds, lowerSouthWestCorner);
  }

  function copyVoxels(
    TypeComponent typeComponent,
    ItemComponent itemComponent,
    PositionComponent positionComponent,
    uint256[] memory creationVoxelIds,
    VoxelCoord memory lowerSouthWestCorner
  ) private {
    // copy the voxels and place it in the world
    for (uint32 i = 0; i < creationVoxelIds.length; i++) {
      uint256 existingEntity = creationVoxelIds[i];
      uint256 newEntity = world.getUniqueEntityId();

      uint256 itemType = itemComponent.getValue(existingEntity);
      uint256 blockType = typeComponent.getValue(existingEntity);
      itemComponent.set(newEntity, itemType);
      typeComponent.set(newEntity, blockType); // TODO: remove typeCompoent
      // TODO: make this into a variable if we have stack space
      CreateBlock.addCustomComponents(components, blockType, newEntity);

      VoxelCoord memory relativeCoord = positionComponent.getValue(existingEntity);

      positionComponent.set(
        newEntity,
        VoxelCoord(
          lowerSouthWestCorner.x + relativeCoord.x,
          lowerSouthWestCorner.y + relativeCoord.y,
          lowerSouthWestCorner.z + relativeCoord.z
        )
      );

      // TODO: do I uncomment this? I'm not so sure. but I think for tests it's fine, since the test already runs the interaction systems
      // I'll leave this commented for now
      // Run block interaction logic
      // BlockInteraction.runInteractionSystems(world.systems(), components, newEntity);
    }
  }

  function executeTyped(uint256 creationId, VoxelCoord memory lowerSouthWestCorner) public returns (bytes memory) {
    return execute(abi.encode(creationId, lowerSouthWestCorner));
  }
}
