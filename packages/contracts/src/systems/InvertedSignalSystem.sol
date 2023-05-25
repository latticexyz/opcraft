// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { PoweredComponent, ID as PoweredComponentID } from "../components/PoweredComponent.sol";
import { InvertedSignalComponent, ID as InvertedSignalComponentID } from "../components/InvertedSignalComponent.sol";
import { SignalComponent, ID as SignalComponentID } from "../components/SignalComponent.sol";
import { SignalSourceComponent, ID as SignalSourceComponentID } from "../components/SignalSourceComponent.sol";
import { VoxelCoord, BlockDirection, SignalData } from "../types.sol";
import { calculateBlockDirection } from "../utils.sol";

uint256 constant ID = uint256(keccak256("system.InvertedSignal"));

contract InvertedSignalSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function runLogic(
    uint256 centerEntityId,
    uint256 neighbourEntityId,
    BlockDirection centerBlockDirection,
    bool centerHasSignal,
    SignalData memory centerSignalData
  ) private returns (bool) {
    InvertedSignalComponent invertedSignalComponent = InvertedSignalComponent(
      getAddressById(components, InvertedSignalComponentID)
    );
    PoweredComponent poweredComponent = PoweredComponent(getAddressById(components, PoweredComponentID));

    bool centerIsPowered = poweredComponent.has(centerEntityId);
    SignalData memory centerPowerData;
    if (centerIsPowered) {
      centerPowerData = poweredComponent.getValue(centerEntityId);
    }

    bool changedEntity = false;

    if (invertedSignalComponent.has(neighbourEntityId)) {
      SignalData memory neighbourSignalData = invertedSignalComponent.getValue(neighbourEntityId);
      if (neighbourSignalData.isActive) {
        // check if we should remain active
        if (centerIsPowered && centerPowerData.isActive) {
          // if center is powered, then we are now adjacent to a powered block, so we should become inactive
          neighbourSignalData.isActive = false;
          neighbourSignalData.direction = centerBlockDirection; // blocked direction
          invertedSignalComponent.set(neighbourEntityId, neighbourSignalData);
          changedEntity = true;
        }

        // TODO: Do we need this? When the block turns off, it should update auto
        // if we are active, lets make sure the center block if its a signal is active
        if (centerHasSignal && !centerSignalData.isActive) {
          // tell it to update
          changedEntity = true;
        }
      } else {
        // check to see if we should be active?
        // were we previously blocked by a powered block
        if (centerIsPowered && !centerPowerData.isActive && neighbourSignalData.direction == centerBlockDirection) {
          // reactivate then
          neighbourSignalData.isActive = true;
          neighbourSignalData.direction = BlockDirection.None; // blocked direction
          invertedSignalComponent.set(neighbourEntityId, neighbourSignalData);
          changedEntity = true;
        }

        // TODO: Do we need this? When the block turns off, it should update auto
        // if we are not active but center is with out direction, then tell it to update
        if (centerHasSignal && centerSignalData.isActive && centerSignalData.direction == centerBlockDirection) {
          // tell it to update
          changedEntity = true;
        }
      }
    }

    return changedEntity;
  }

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
      changedEntity = runLogic(
        centerEntityId,
        neighbourEntityId,
        centerBlockDirection,
        centerHasSignal,
        centerSignalData
      );

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
