// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { TransitionRule } from "../types.sol";
import { TypeComponent, ID as TypeComponentID } from "../components/TypeComponent.sol";
import { ColorComponent, ID as ColorComponentID } from "../components/ColorComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { VoxelRulesComponent, ID as VoxelRulesComponentID } from "../components/VoxelRulesComponent.sol";
import { TransitionRuleComponent, ID as TransitionRuleComponentID } from "../components/TransitionRuleComponent.sol";
import { UpdateSetComponent, ID as UpdateQueueComponentID } from "../components/UpdateSetComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { VoxelCoord } from "../types.sol";

uint256 constant ID = uint256(keccak256("system.UpdateVoxels"));

contract UpdateVoxelsSystem is System {
  int8[18] private NEIGHBOR_COORD_OFFSETS = [
    int8(0),
    int8(0),
    int8(1),
    int8(0),
    int8(0),
    int8(-1),
    int8(1),
    int8(0),
    int8(0),
    int8(-1),
    int8(0),
    int8(0),
    int8(0),
    int8(1),
    int8(0),
    int8(0),
    int8(-1),
    int8(0)
  ];

  constructor(IWorld _world, address _components) System(_world, _components) {}

  struct NextVoxelState {
    uint256 voxelId;
    uint256 voxelType;
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    UpdateSetComponent updateSetComponent = UpdateSetComponent(getAddressById(components, UpdateQueueComponentID));
    TypeComponent typeComponent = TypeComponent(getAddressById(components, TypeComponentID));
    ColorComponent colorComponent = ColorComponent(getAddressById(components, ColorComponentID));
    VoxelRulesComponent voxelRulesComponent = VoxelRulesComponent(getAddressById(components, VoxelRulesComponentID));
    TransitionRuleComponent transitionRuleComponent = TransitionRuleComponent(
      getAddressById(components, TransitionRuleComponentID)
    );
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));

    uint256[] memory voxelIdsToUpdate = updateSetComponent.getVoxels();
    NextVoxelState[] memory nextVoxelStates = new NextVoxelState[](voxelIdsToUpdate.length);
    uint256 nextVoxelStatesLength = 0;
    for (uint256 i = 0; i < voxelIdsToUpdate.length; i++) {
      uint256 voxelId = voxelIdsToUpdate[i];
      uint256 nextType = updateVoxel(
        positionComponent,
        voxelRulesComponent,
        transitionRuleComponent,
        typeComponent,
        voxelId
      );
      if (nextType == type(uint256).max) {
        continue;
      }
      nextVoxelStates[nextVoxelStatesLength] = NextVoxelState(voxelId, nextType);
      nextVoxelStatesLength++;
    }

    // we have currently updated all voxels in the current tick. So we can actually update them now
    for (uint256 i = 0; i < nextVoxelStatesLength; i++) {
      NextVoxelState memory nextState = nextVoxelStates[i];
      typeComponent.set(nextState.voxelId, nextState.voxelType);
    }

    updateSetComponent.clearSet();
    // push neighboring blocks onto update queue
    for (uint256 i = 0; i < nextVoxelStatesLength; i++) {
      NextVoxelState memory nextState = nextVoxelStates[i];
      VoxelCoord memory voxelCoord = positionComponent.getValue(nextState.voxelId);
      (uint256[] memory neighboringVoxelIds, uint8 numNeighbours) = getNeighboringVoxelIds(
        positionComponent,
        voxelCoord
      );
      for (uint256 j = 0; j < numNeighbours; j++) {
        // rn, this also adds air voxels. Why not filter out air voxels? cause we don't know the voxeltype unless we use the type component
        updateSetComponent.addVoxel(neighboringVoxelIds[i]);
      }
    }
  }

  function updateVoxel(
    PositionComponent positionComponent,
    VoxelRulesComponent voxelRulesComponent,
    TransitionRuleComponent transitionRuleComponent,
    TypeComponent typeComponent,
    uint256 voxelId
  ) private returns (uint256 nextType) {
    VoxelCoord memory voxelCoord = positionComponent.getValue(voxelId);
    uint256[] memory ruleIds = voxelRulesComponent.getValue(voxelId);

    for (uint256 j = 0; j < ruleIds.length; j++) {
      uint256 ruleId = ruleIds[j];
      TransitionRule memory transitionRule = transitionRuleComponent.get(ruleId);
      if (hasNeighboringVoxel(positionComponent, typeComponent, voxelCoord, transitionRule.lookForType)) {
        return transitionRule.changeToType;
      }
    }
    return type(uint256).max;
  }

  function getNeighboringVoxelIds(PositionComponent positionComponent, VoxelCoord memory centerCoord)
    private
    view
    returns (uint256[] memory, uint8)
  {
    uint8 numNeighbours = 0;
    uint256[] memory neighboringVoxelIds = new uint256[](6);
    for (uint8 i = 0; i < 6; i++) {
      VoxelCoord memory neighboringCoord = VoxelCoord(
        centerCoord.x + NEIGHBOR_COORD_OFFSETS[i * 3],
        centerCoord.y + NEIGHBOR_COORD_OFFSETS[i * 3 + 1],
        centerCoord.z + NEIGHBOR_COORD_OFFSETS[i * 3 + 2]
      );
      uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(neighboringCoord);
      if (entitiesAtPosition.length != 1) {
        // TODO: emit a LOG event if there isn't one entity at this position. please specify the entityId, and the voxelcoord
        continue;
      }
      neighboringVoxelIds[numNeighbours] = entitiesAtPosition[0];
      numNeighbours++;
    }
    return (neighboringVoxelIds, numNeighbours);
  }

  function hasNeighboringVoxel(
    PositionComponent positionComponent,
    TypeComponent typeComponent,
    VoxelCoord memory centerCoord,
    uint256 neighboringType
  ) private view returns (bool) {
    (uint256[] memory neighboringVoxelIds, uint256 numNeighbours) = getNeighboringVoxelIds(
      positionComponent,
      centerCoord
    );
    for (uint256 i = 0; i < numNeighbours; i++) {
      if (typeComponent.getValue(neighboringVoxelIds[i]) == neighboringType) {
        return true;
      }
    }
    return false;
  }
}
