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

import { VoxelCoord } from "../types.sol";

uint256 constant ID = uint256(keccak256("system.HalfAdderTest"));

contract HalfAdderTestSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // returns true if the test is passed
  function execute(bytes memory arguments) public returns (bytes memory) {
    (
      uint256 creationId,
      VoxelCoord memory in1Voxel,
      VoxelCoord memory in2Voxel,
      VoxelCoord memory outVoxel,
      VoxelCoord memory carryOutVoxel
    ) = abi.decode(arguments, (uint256, VoxelCoord, VoxelCoord, VoxelCoord, VoxelCoord));

    // TODO: do we require all output to be false first?

    SignalComponent signalComponent = SignalComponent(getAddressById(components, SignalComponentID));

    (uint256 in1VoxelId, uint256 in2VoxelId, uint256 outVoxelId, uint256 carryOutVoxelId) = getVoxelIds(
      in1Voxel,
      in2Voxel,
      outVoxel,
      carryOutVoxel
    );
    // it's fine if we set the signalSource of the voxel directly cause other tests will do the same
    // the test is to see if 1 + 1 = 0 and carryOut = 1

    // defined like so cause stack too deep
    SignalSourceComponent(getAddressById(components, SignalSourceComponentID)).set(in1VoxelId);
    SignalSourceComponent(getAddressById(components, SignalSourceComponentID)).set(in2VoxelId);
    if (
      signalComponent.getValue(outVoxelId).isActive == false &&
      signalComponent.getValue(carryOutVoxelId).isActive == true
    ) {
      // defined here cause stack too deep
      PassesTestsComponent(getAddressById(components, PassesTestsComponentID)).addTest(creationId, ID);
      //   return abi.encode(true); // if the transaction passes, the test passed!
    }
    require(false, "HalfAdderTest failed"); // this is really hacky but by failing the transaction, the user gets immediate feedback in the ui
    // the test failed
    // return abi.encode(false);
  }

  function getVoxelIds(
    VoxelCoord memory in1Voxel,
    VoxelCoord memory in2Voxel,
    VoxelCoord memory outVoxel,
    VoxelCoord memory carryOutVoxel
  )
    private
    view
    returns (
      uint256,
      uint256,
      uint256,
      uint256
    )
  {
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    uint256[] memory in1VoxelIds = positionComponent.getEntitiesWithValue(in1Voxel);
    uint256[] memory in2VoxelIds = positionComponent.getEntitiesWithValue(in2Voxel);
    uint256[] memory outVoxelIds = positionComponent.getEntitiesWithValue(outVoxel);
    uint256[] memory carryOutVoxelIds = positionComponent.getEntitiesWithValue(carryOutVoxel);

    require(in1VoxelIds.length == 1, "in1VoxelIds.length != 1");
    require(in2VoxelIds.length == 1, "in2VoxelIds.length != 1");
    require(outVoxelIds.length == 1, "outVoxelIds.length != 1");
    require(carryOutVoxelIds.length == 1, "carryOutVoxelIds.length != 1");

    return (in1VoxelIds[0], in2VoxelIds[0], outVoxelIds[0], carryOutVoxelIds[0]);
  }

  function executeTyped(
    uint256 creationId,
    VoxelCoord memory in1Voxel,
    VoxelCoord memory in2Voxel,
    VoxelCoord memory outVoxel,
    VoxelCoord memory carryOutVoxel
  ) public returns (bool) {
    return abi.decode(execute(abi.encode(creationId, in1Voxel, in2Voxel, outVoxel, carryOutVoxel)), (bool));
  }
}
