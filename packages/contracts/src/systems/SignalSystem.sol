// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { SignalComponent, ID as SignalComponentID, SignalData } from "../components/SignalComponent.sol";
import { SignalSourceComponent, ID as SignalSourceComponentID } from "../components/SignalSourceComponent.sol";
import { VoxelCoord, BlockDirection } from "../types.sol";
import { calculateBlockDirection } from "../utils.sol";

uint256 constant ID = uint256(keccak256("system.Signal"));

contract SignalSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 centerEntityId, uint256[] memory neighbourEntityIds) = abi.decode(arguments, (uint256, uint256[]));

    // Initialize components
    SignalComponent signalComponent = SignalComponent(getAddressById(components, SignalComponentID));
    SignalSourceComponent signalSourceComponent = SignalSourceComponent(
      getAddressById(components, SignalSourceComponentID)
    );
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));

    // If a entity does not need to be changed, its value is set to 0
    // We do it this way because dynamic arrays in a function are not supported in Solidity yet
    uint256[] memory changedEntityIds = new uint256[](neighbourEntityIds.length);

    // check if centerEntityId is a SignalSource
    bool centerHasSignalSource = signalSourceComponent.has(centerEntityId);
    bool centerHasSignal = false;
    SignalData memory centerSignalData;
    if (!centerHasSignalSource) {
      // check if its an active signal otherwise
      centerHasSignal = signalComponent.has(centerEntityId);
      if (centerHasSignal) {
        centerSignalData = signalComponent.getValue(centerEntityId);
      }
    }
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
      // check if neighbourEntityId exists in signalComponent
      if (signalComponent.has(neighbourEntityId)) {
        SignalData memory neighbourSignalData = signalComponent.getValue(neighbourEntityId);
        // check if center is active
        if (centerHasSignalSource || (centerHasSignal && centerSignalData.isActive)) {
          // check if we are already active?
          if (neighbourSignalData.isActive) {
            // then do nothing
          } else {
            // otherwise, if center is active, and we are not active, we should become active
            // using this center as the source block direction
            neighbourSignalData.isActive = true;
            neighbourSignalData.direction = centerBlockDirection;
            signalComponent.set(neighbourEntityId, neighbourSignalData);
            changedEntity = true;
          }
        } else {
          // if center is not active or doesn't exist
          if (neighbourSignalData.isActive) {
            // and we are active
            // check if the source used to come from the center direction
            if (neighbourSignalData.direction == centerBlockDirection) {
              // then we should become inactive
              neighbourSignalData.isActive = false;
              neighbourSignalData.direction = BlockDirection.None;
              signalComponent.set(neighbourEntityId, neighbourSignalData);
              changedEntity = true;
            } else {
              // otherwise, do nothing

              // check if center block is a signal block that is not active, because if we're active we need to update it
              if (centerHasSignal && !centerSignalData.isActive) {
                // then since our source is from someplace else (previous if statement), then we can give the center block our signal
                // we dont want to update it here, otherwise the other neighbours won't get the appropriate signal
                // so we simply add ourself to the changed list, so it will get called as a neighbour
                changedEntity = true;
              }
            }
          } else {
            // and we are not active either, then do nothing
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
