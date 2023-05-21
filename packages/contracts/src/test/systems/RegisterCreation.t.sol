// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { Deploy } from "../Deploy.sol";
import { MudTest } from "std-contracts/test/MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { RegisterVoxelTypeSystem, ID as RegisterVoxelTypeSystemID } from "../../systems/RegisterVoxelTypeSystem.sol";
import { RegisterCreationSystem, ID as RegisterCreationSystemID } from "../../systems/RegisterCreationSystem.sol";
import { BuildSystem, ID as BuildSystemID } from "../../systems/BuildSystem.sol";
import { ItemComponent, ID as ItemComponentID } from "../../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";
import { TransitionRule } from "../../types.sol";
import { TypeComponent, ID as TypeComponentID } from "../../components/TypeComponent.sol";
import { VoxelCoord } from "../../types.sol";

contract RegisterCreationTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  uint256 textvoxel;
  uint256 textvoxel2;

  function setUp() public override {
    super.setUp();
    vm.startPrank(deployer);

    RegisterVoxelTypeSystem registerVoxelTypeSystem = RegisterVoxelTypeSystem(system(RegisterVoxelTypeSystemID));
    TransitionRule[] memory rules = new TransitionRule[](1);
    rules[0] = TransitionRule(uint256(blockhash(block.number + 93)), uint256(blockhash(block.number + 97)));
    uint256 voxelTypeId = registerVoxelTypeSystem.executeTyped("testVoxel", rules, "#092936");

    TypeComponent typeComponent = TypeComponent(component(TypeComponentID));

    // Give 2 textvoxel blocks to alice
    textvoxel = world.getUniqueEntityId();
    ItemComponent(component(ItemComponentID)).set(textvoxel, voxelTypeId);
    OwnedByComponent(component(OwnedByComponentID)).set(textvoxel, addressToEntity(alice));
    typeComponent.set(textvoxel, voxelTypeId);

    textvoxel2 = world.getUniqueEntityId();
    ItemComponent(component(ItemComponentID)).set(textvoxel2, voxelTypeId);
    OwnedByComponent(component(OwnedByComponentID)).set(textvoxel2, addressToEntity(alice));
    typeComponent.set(textvoxel2, voxelTypeId);

    vm.stopPrank();
  }

  function testRegisterCreation() public {
    vm.startPrank(alice);
    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    VoxelCoord memory coord1 = VoxelCoord(1, 1, 1);
    VoxelCoord memory coord2 = VoxelCoord(2, 1, 1);
    buildSystem.executeTyped(textvoxel, coord1);
    buildSystem.executeTyped(textvoxel2, coord2);

    RegisterCreationSystem registerCreationSystem = RegisterCreationSystem(system(RegisterCreationSystemID));
    TransitionRule[] memory rules = new TransitionRule[](1);
    rules[0] = TransitionRule(uint256(blockhash(block.number + 93)), uint256(blockhash(block.number + 97)));
    registerCreationSystem.executeTyped("testCreation", coord1, coord2);
    vm.stopPrank();
  }
}
