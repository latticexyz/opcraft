// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../components/ItemComponent.sol";
import { PoweredComponent, ID as PoweredComponentID } from "../components/PoweredComponent.sol";
import { PistonComponent, ID as PistonComponentID, HEAD_EXTEND_DIRECTION, PistonData } from "../components/PistonComponent.sol";
import { VoxelCoord, BlockDirection, SignalData } from "../types.sol";
import { calculateBlockDirection, getOppositeDirection, getVoxelCoordInDirection } from "../utils.sol";
import { AirID, BedrockID } from "../prototypes/Blocks.sol";

uint256 constant ID = uint256(keccak256("system.Piston"));

contract PistonSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // returns the number of blocks air is in front of the piston head
  // 0 if there is no air, or it shouldn't be extended
  // TODO: Replace with int32 with uint16, just got some Solidity conversion issues
  // TODO: should multi return bool and int32
  function shouldBeExtended(uint256 pistonEntityId, int32 maxNumBlocksMove) private returns (int32) {
    PoweredComponent poweredComponent = PoweredComponent(getAddressById(components, PoweredComponentID));
    if (!poweredComponent.has(pistonEntityId)) {
      // if it is not powered, it should not be extended
      return 0;
    }

    SignalData memory powerData = poweredComponent.getValue(pistonEntityId);
    if (!powerData.isActive || getOppositeDirection(powerData.direction) == HEAD_EXTEND_DIRECTION) {
      // if it is not powered or power is coming from the head, it should not be extended
      // if power is coming from the head and we extended, we'd lose the power so don't do that
      return 0;
    }

    PistonComponent pistonComponent = PistonComponent(getAddressById(components, PistonComponentID));
    PistonData memory pistonData = pistonComponent.getValue(pistonEntityId);
    if (pistonData.isExtended) {
      // if it is already extended, it should not be extended, we just return a value bigger than 0
      return 1;
    }

    // now we check the blocks in the direction the head will extend
    // if there is any air, up to the max extension, we can extend
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));
    VoxelCoord memory position = positionComponent.getValue(pistonEntityId);
    int32 numBlocksToAir = 0;
    for (int32 i = 0; i <= maxNumBlocksMove; i++) {
      position = getVoxelCoordInDirection(position, HEAD_EXTEND_DIRECTION, 1);
      // check if position is air
      uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(position);
      require(entitiesAtPosition.length == 1, "can not built at non-empty coord (5)");
      if (itemComponent.getValue(entitiesAtPosition[0]) == AirID) {
        numBlocksToAir = i + 1;
        break;
      }
    }

    return numBlocksToAir;
  }

  function extendPiston(uint256 pistonEntityId, int32 numBlocksToAir) private {
    PistonComponent pistonComponent = PistonComponent(getAddressById(components, PistonComponentID));
    // to extend, we need to start with the last air block, and keep swapping entity positions until the first one is air
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));
    VoxelCoord memory pistonPosition = positionComponent.getValue(pistonEntityId);
    uint256 pistonHeadEntityId = 0;

    if (numBlocksToAir == 1) {
      // then there are no blocks in front of the piston
      uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(
        getVoxelCoordInDirection(pistonPosition, HEAD_EXTEND_DIRECTION, 1)
      );
      require(entitiesAtPosition.length == 1, "can not built at non-empty coord (6)");
      pistonHeadEntityId = entitiesAtPosition[0];
    }

    // if numBlocksToAir is 1, then that means the first block is air, so we don't need to do anything
    for (int32 i = numBlocksToAir; i > 1; i--) {
      // swap the position of entities at i and i - 1

      VoxelCoord memory firstPosition = getVoxelCoordInDirection(pistonPosition, HEAD_EXTEND_DIRECTION, i);
      VoxelCoord memory secondPosition = getVoxelCoordInDirection(pistonPosition, HEAD_EXTEND_DIRECTION, i - 1);
      uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(firstPosition);
      require(entitiesAtPosition.length == 1, "can not built at non-empty coord (7)");
      uint256 entityAtFirstPosition = entitiesAtPosition[0];
      entitiesAtPosition = positionComponent.getEntitiesWithValue(secondPosition);
      require(entitiesAtPosition.length == 1, "can not built at non-empty coord (8)");
      uint256 entityAtSecondPosition = entitiesAtPosition[0];
      // swap the positions
      positionComponent.remove(entityAtFirstPosition);
      positionComponent.remove(entityAtSecondPosition);
      positionComponent.set(entityAtFirstPosition, secondPosition);
      positionComponent.set(entityAtSecondPosition, firstPosition);

      if (i == 2) {
        // this is the last swap, so we need to set the piston head entity id
        pistonHeadEntityId = entityAtFirstPosition;
      }
    }

    // then finally, the first one air in front of the piston head, we should change the type of it to the piston head
    itemComponent.set(pistonHeadEntityId, BedrockID);
    PistonData memory pistonData = pistonComponent.getValue(pistonEntityId);
    pistonData.isExtended = true;
    pistonComponent.set(pistonEntityId, pistonData);
  }

  function retractPiston(uint256 pistonEntityId) private {
    // remove the head block entity
    PistonComponent pistonComponent = PistonComponent(getAddressById(components, PistonComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    VoxelCoord memory position = positionComponent.getValue(pistonEntityId);
    position = getVoxelCoordInDirection(position, HEAD_EXTEND_DIRECTION, 1);
    uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(position);
    require(entitiesAtPosition.length == 1, "can not built at non-empty coord (1)");
    // set to air
    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));
    require(itemComponent.getValue(entitiesAtPosition[0]) == BedrockID, "can not retract piston head");
    itemComponent.set(entitiesAtPosition[0], AirID);
    PistonData memory pistonData = pistonComponent.getValue(pistonEntityId);
    pistonData.isExtended = false;
    pistonComponent.set(pistonEntityId, pistonData);
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 centerEntityId, uint256[] memory neighbourEntityIds) = abi.decode(arguments, (uint256, uint256[]));

    // Initialize components
    PistonComponent pistonComponent = PistonComponent(getAddressById(components, PistonComponentID));
    PoweredComponent poweredComponent = PoweredComponent(getAddressById(components, PoweredComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));

    // If a entity does not need to be changed, its value is set to 0
    // We do it this way because dynamic arrays in a function are not supported in Solidity yet
    uint256[] memory changedEntityIds = new uint256[](neighbourEntityIds.length);

    require(positionComponent.has(centerEntityId), "centerEntityId must have a position"); // even if its air, it must have a position
    VoxelCoord memory centerPosition = positionComponent.getValue(centerEntityId);

    // go through all neighbourEntityIds
    for (uint8 i = 0; i < neighbourEntityIds.length; i++) {
      bool changedEntity = false;
      uint256 neighbourEntityId = neighbourEntityIds[i];
      if (neighbourEntityId == 0) {
        changedEntityIds[i] = 0;
        continue;
      }
      require(positionComponent.has(neighbourEntityId), "neighbourEntityId must have a position");
      BlockDirection centerBlockDirection = calculateBlockDirection(
        centerPosition,
        positionComponent.getValue(neighbourEntityId)
      );

      if (pistonComponent.has(neighbourEntityId)) {
        PistonData memory pistonData = pistonComponent.getValue(neighbourEntityId);
        int32 numBlocksToAir = shouldBeExtended(neighbourEntityId, pistonData.maxNumBlocksMove);
        // if piston block should not be extended
        if (numBlocksToAir == 0) {
          // and it is extended
          if (pistonData.isExtended) {
            // retract
            retractPiston(neighbourEntityId);
            changedEntity = true;
          }
        } else {
          // it should be extended

          // and it is not already extended
          if (!pistonData.isExtended) {
            // extend
            extendPiston(neighbourEntityId, numBlocksToAir);
            changedEntity = true;
          }
        }
      }

      if (changedEntity) {
        changedEntityIds[i] = neighbourEntityId;
      } else {
        changedEntityIds[i] = 0;
      }
    }

    return abi.encode(changedEntityIds);
  }

  function executeTyped(uint256 centerEntityId, uint256[] memory neighbourEntityIds)
    public
    returns (uint256[] memory changedEntityIds)
  {
    return abi.decode(execute(abi.encode(centerEntityId, neighbourEntityIds)), (uint256[]));
  }
}
