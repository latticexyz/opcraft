// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { VoxelsComponent, ID as VoxelsComponentID } from "../components/VoxelsComponent.sol";
import { PassesTestsComponent, ID as PassesTestsComponentID } from "../components/PassesTestsComponent.sol";
import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";
import { SignalComponent, ID as SignalComponentID, SignalData } from "../components/SignalComponent.sol";
import { SignalSourceComponent, ID as SignalSourceComponentID } from "../components/SignalSourceComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { BlockInteraction } from "../libraries/BlockInteraction.sol";

import { VoxelCoord } from "../types.sol";

uint256 constant ID = uint256(keccak256("system.AndTest"));

contract AndTestSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // returns true if the test is passed
  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 creationId, VoxelCoord memory in1Voxel, VoxelCoord memory in2Voxel, VoxelCoord memory outVoxel) = abi
      .decode(arguments, (uint256, VoxelCoord, VoxelCoord, VoxelCoord));

    // TODO: do we require all output to be false first?

    PassesTestsComponent passesTestsComponent = PassesTestsComponent(
      getAddressById(components, PassesTestsComponentID)
    );
    SignalComponent signalComponent = SignalComponent(getAddressById(components, SignalComponentID));
    SignalSourceComponent signalSourceComponent = SignalSourceComponent(
      getAddressById(components, SignalSourceComponentID)
    );

    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    uint256[] memory in1VoxelIds = positionComponent.getEntitiesWithValue(in1Voxel);
    uint256[] memory in2VoxelIds = positionComponent.getEntitiesWithValue(in2Voxel);
    uint256[] memory outVoxelIds = positionComponent.getEntitiesWithValue(outVoxel);

    require(in1VoxelIds.length == 1, "in1VoxelIds.length != 1");
    require(in2VoxelIds.length == 1, "in2VoxelIds.length != 1");
    require(outVoxelIds.length == 1, "outVoxelIds.length != 1");

    uint256 in1VoxelId = in1VoxelIds[0];
    uint256 in2VoxelId = in2VoxelIds[0];
    uint256 outVoxelId = outVoxelIds[0];

    signalSourceComponent.set(in1VoxelId);
    signalSourceComponent.set(in2VoxelId);

    BlockInteraction.runInteractionSystems(world.systems(), components, in1VoxelId); // TODO: add a way to add both voxels onto the interaction queue
    BlockInteraction.runInteractionSystems(world.systems(), components, in2VoxelId);

    if (signalComponent.getValue(outVoxelId).isActive) {
      passesTestsComponent.addTest(ID, creationId);
      //   return abi.encode(true); // if the transaction passes, the test passed!
    }
    require(false, "AndTest failed"); // this is really hacky but by failing the transaction, the user gets immediate feedback in the ui
    // the test failed
    // return abi.encode(false);
  }

  function executeTyped(
    uint256 creationId,
    VoxelCoord memory in1Voxel,
    VoxelCoord memory in2Voxel,
    VoxelCoord memory outVoxel
  ) public returns (bool) {
    return abi.decode(execute(abi.encode(creationId, in1Voxel, in2Voxel, outVoxel)), (bool));
  }
}
