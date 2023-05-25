// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { SignalComponent, ID as SignalComponentID } from "../components/SignalComponent.sol";
import { SignalSourceComponent, ID as SignalSourceComponentID } from "../components/SignalSourceComponent.sol";
import { PoweredComponent, ID as PoweredComponentID } from "../components/PoweredComponent.sol";
import { InvertedSignalComponent, ID as InvertedSignalComponentID } from "../components/InvertedSignalComponent.sol";
import { VoxelCoord, BlockDirection, SignalData } from "../types.sol";
import { calculateBlockDirection } from "../utils.sol";

uint256 constant ID = uint256(keccak256("system.SignalSource"));

contract SignalSourceSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 centerEntityId, uint256[] memory neighbourEntityIds) = abi.decode(arguments, (uint256, uint256[]));

    // Initialize components
    SignalSourceComponent signalSourceComponent = SignalSourceComponent(
      getAddressById(components, SignalSourceComponentID)
    );
    PoweredComponent poweredComponent = PoweredComponent(getAddressById(components, PoweredComponentID));
    SignalComponent signalComponent = SignalComponent(getAddressById(components, SignalComponentID));
    InvertedSignalComponent invertedSignalComponent = InvertedSignalComponent(
      getAddressById(components, InvertedSignalComponentID)
    );
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));

    // If a entity does not need to be changed, its value is set to 0
    // We do it this way because dynamic arrays in a function are not supported in Solidity yet
    uint256[] memory changedEntityIds = new uint256[](neighbourEntityIds.length);

    bool centerHasSignal = signalComponent.has(centerEntityId);
    bool centerHasInvertedSignal = false;
    SignalData memory centerSignalData;
    if (centerHasSignal) {
      centerSignalData = signalComponent.getValue(centerEntityId);
    } else {
      centerHasInvertedSignal = invertedSignalComponent.has(centerEntityId);
      if (centerHasInvertedSignal) {
        centerSignalData = invertedSignalComponent.getValue(centerEntityId);
      }
    }

    bool centerIsPowered = poweredComponent.has(centerEntityId);
    SignalData memory centerPowerData;
    if (centerIsPowered) {
      centerPowerData = poweredComponent.getValue(centerEntityId);
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

      // if center is a signal that is not active, and neighbour is a signal source
      if ((centerHasSignal && !centerSignalData.isActive) && signalSourceComponent.has(neighbourEntityId)) {
        // if centerSignalData is not active, we need to add neighbour signal source block to entity list so it can be turned on
        changedEntity = true;
      }

      bool shouldBeSource = centerHasInvertedSignal &&
        centerSignalData.isActive &&
        centerBlockDirection == BlockDirection.Down;

      // check to see if neighbour is a powered component
      if (signalSourceComponent.has(neighbourEntityId)) {
        bool isNaturalSource = signalSourceComponent.getValue(neighbourEntityId);
        if (!shouldBeSource && !isNaturalSource) {
          // should not be a signal source
          signalSourceComponent.remove(neighbourEntityId);
          changedEntity = true;
        }
      } else {
        // if the neighbour is above the center which is an inverted signal
        if (shouldBeSource) {
          // then we SHOULD be a signal source
          signalSourceComponent.set(neighbourEntityId, false);
          changedEntity = true;
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
