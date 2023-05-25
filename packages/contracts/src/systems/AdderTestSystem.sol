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

uint256 constant ID = uint256(keccak256("system.AdderTest"));
uint256 constant NUM_BITS = 1;

contract AdderTestSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // returns true if the test is passed
  function execute(bytes memory arguments) public returns (bytes memory) {
    (
      uint256 creationId,
      uint256[] memory in1VoxelIds,
      uint256[] memory in2VoxelIds,
      uint256[] memory outVoxelIds,
      uint256 carryOutVoxelId
    ) = abi.decode(arguments, (uint256, string));

    // TODO: do we require all output to be false first?

    require(in1VoxelIds.length == NUM_BITS, "in1VoxelIds.length != 1");
    require(in2VoxelIds.length == NUM_BITS, "in2VoxelIds.length != 1");
    require(outVoxelIds.length == NUM_BITS, "outVoxelIds.length != 1");

    PassesTestsComponent passesTestsComponent = PassesTestsComponent(
      getAddressById(components, PassesTestsComponentID)
    );
    SignalComponent signalComponent = SignalComponent(getAddressById(components, SignalComponentID));
    SignalSourceComponent signalSourceComponent = SignalSourceComponent(
      getAddressById(components, SignalSourceComponentID)
    );

    // it's fine if we set the signalSource of the voxel directly cause other tests will do the same
    // the test is to see if 1 + 1 = 0 and carryOut = 1
    signalSourceComponent.set(in1VoxelIds[0], true);
    signalSourceComponent.set(in2VoxelIds[0], true);
    if (
      signalComponent.get(outVoxelIds[0]).isActive == false && signalComponent.get(carryOutVoxelId).isActive == true
    ) {
      passesTestComponent.addTest(creationId, ID);
      return abi.encode(true);
    }
    // the test failed
    return abi.encode(false);
  }

  // uint256 in1 = 3;
  // uint256 in2 = 4;
  // TODO: set the ith bit of the inputVoxels to be 1 or 0 depending on the ith bit of in1 and in2
  // test a 1-bit adder for now.
  // VoxelsComponent voxelsComponent = VoxelsComponent(getAddressById(components, VoxelsComponentID));
  // uint256[] memory creationVoxelIds = voxelsComponent.get(creationId);
  // for(uint256 input = 0; input < 7; input++){
  //   for(uint256 bitIdx = 0; bitIdx < 3; bitIdx++){
  //     uint256 bit = input >> bitIdx & 1;
  //     inputVoxels[i]

  //   }
  // }
  // uint256 testId = world.getUniqueEntityId();
  // NameComponent nameComponent = NameComponent(getAddressById(components, NameComponentID));
  // nameComponent.set(testId, "a);

  function executeTyped(uint256 entity, string memory name) public returns (bytes memory) {
    return abi.decode(execute(abi.encode(entity, name)));
  }
}
