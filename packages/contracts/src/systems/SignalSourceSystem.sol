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
    SignalComponent signalComponent = SignalComponent(getAddressById(components, SignalComponentID));
    // PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));

    // If a entity does not need to be changed, its value is set to 0
    // We do it this way because dynamic arrays in a function are not supported in Solidity yet
    uint256[] memory changedEntityIds = new uint256[](neighbourEntityIds.length);

    bool centerHasSignal = signalComponent.has(centerEntityId);
    SignalData memory centerSignalData;
    if (centerHasSignal) {
      centerSignalData = signalComponent.getValue(centerEntityId);
    }

    // require(positionComponent.has(centerEntityId), "centerEntityId must have a position"); // even if its air, it must have a position

    // go through all neighbourEntityIds
    for (uint8 i = 0; i < neighbourEntityIds.length; i++) {
      bool changedEntity = false;
      uint256 neighbourEntityId = neighbourEntityIds[i];
      if (neighbourEntityId == 0) {
        changedEntityIds[i] = 0;
        continue;
      }
      // require(positionComponent.has(neighbourEntityId), "neighbourEntityId must have a position");

      // if center is a signal that is not active, and neighbour is a signal source
      if ((centerHasSignal && !centerSignalData.isActive) && signalSourceComponent.has(neighbourEntityId)) {
        // if centerSignalData is not active, we need to add neighbour signal source block to entity list so it can be turned on
        changedEntity = true;
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
