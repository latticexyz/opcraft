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

uint256 constant ID = uint256(keccak256("system.Powered"));

contract PoweredSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function runLogic(
    uint256 centerEntityId,
    uint256 neighbourEntityId,
    bool centerHasSignal,
    bool centerHasSignalSource,
    SignalData memory centerSignalData,
    BlockDirection centerBlockDirection
  ) private returns (bool) {
    PoweredComponent poweredComponent = PoweredComponent(getAddressById(components, PoweredComponentID));
    InvertedSignalComponent invertedSignalComponent = InvertedSignalComponent(
      getAddressById(components, InvertedSignalComponentID)
    );
    bool centerIsPowered = poweredComponent.has(centerEntityId);
    SignalData memory centerPowerData;
    if (centerIsPowered) {
      centerPowerData = poweredComponent.getValue(centerEntityId);
    }

    bool centerHasInvertedSignal = invertedSignalComponent.has(centerEntityId);
    if (centerHasInvertedSignal) {
      centerSignalData = invertedSignalComponent.getValue(centerEntityId);
    }

    bool changedEntity = false;

    if (poweredComponent.has(neighbourEntityId)) {
      SignalData memory neighbourSignalData = poweredComponent.getValue(neighbourEntityId);

      // 3 conditions
      // 1) if center is signal source, then we turn on no matter what
      // 2) if its an inverted singal, we turn on as long as we're not below it (TODO: removed for now, but add it back in)
      // 3) if its an active signal, turn on if we're in its direction or below it

      bool shouldBePowered = centerHasSignalSource ||
        // (centerHasInvertedSignal && centerSignalData.isActive && centerBlockDirection != BlockDirection.Down) ||
        (centerHasSignal &&
          centerSignalData.isActive &&
          (centerSignalData.direction == centerBlockDirection || centerBlockDirection == BlockDirection.Down));

      if (neighbourSignalData.isActive) {
        // check to see if we should be turned off
        if (neighbourSignalData.direction == centerBlockDirection) {
          if (!shouldBePowered) {
            neighbourSignalData.isActive = false;
            neighbourSignalData.direction = BlockDirection.None;
            poweredComponent.set(neighbourEntityId, neighbourSignalData);
            changedEntity = true;
          }
        }

        if (neighbourSignalData.isActive) {
          if (centerHasInvertedSignal && centerSignalData.isActive) {
            // should be off
            changedEntity = true;
          }
        }
      } else {
        // check to see if we should be powered

        if (shouldBePowered) {
          neighbourSignalData.isActive = true;
          neighbourSignalData.direction = centerBlockDirection;
          poweredComponent.set(neighbourEntityId, neighbourSignalData);
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

      changedEntity =
        changedEntity ||
        runLogic(
          centerEntityId,
          neighbourEntityId,
          centerHasSignal,
          centerHasSignalSource,
          centerSignalData,
          centerBlockDirection
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
