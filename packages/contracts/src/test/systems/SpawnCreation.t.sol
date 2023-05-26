// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { Deploy } from "../Deploy.sol";
import { MudTest } from "std-contracts/test/MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { RegisterVoxelTypeSystem, ID as RegisterVoxelTypeSystemID } from "../../systems/RegisterVoxelTypeSystem.sol";
import { RegisterCreationSystem, ID as RegisterCreationSystemID } from "../../systems/RegisterCreationSystem.sol";
import { SpawnCreationSystem, ID as SpawnCreationSystemID } from "../../systems/SpawnCreationSystem.sol";
import { BuildSystem, ID as BuildSystemID } from "../../systems/BuildSystem.sol";
import { ItemComponent, ID as ItemComponentID } from "../../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";
import { TransitionRule } from "../../types.sol";
import { TypeComponent, ID as TypeComponentID } from "../../components/TypeComponent.sol";
import { VoxelCoord } from "../../types.sol";

contract SpawnCreationTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  uint256 testvoxel;
  uint256 testvoxel2;

  function setUp() public override {
    super.setUp();
    vm.startPrank(deployer);

    RegisterVoxelTypeSystem registerVoxelTypeSystem = RegisterVoxelTypeSystem(system(RegisterVoxelTypeSystemID));
    TransitionRule[] memory rules = new TransitionRule[](1);
    rules[0] = TransitionRule(uint256(blockhash(block.number + 93)), uint256(blockhash(block.number + 97)));
    uint256 voxelTypeId = registerVoxelTypeSystem.executeTyped("testVoxel", rules, "#092936");

    TypeComponent typeComponent = TypeComponent(component(TypeComponentID));

    // Give 2 testvoxel blocks to alice
    testvoxel = world.getUniqueEntityId();
    ItemComponent(component(ItemComponentID)).set(testvoxel, voxelTypeId);
    typeComponent.set(testvoxel, voxelTypeId);
    OwnedByComponent(component(OwnedByComponentID)).set(testvoxel, addressToEntity(alice));

    testvoxel2 = world.getUniqueEntityId();
    ItemComponent(component(ItemComponentID)).set(testvoxel2, voxelTypeId);
    typeComponent.set(testvoxel2, voxelTypeId);
    OwnedByComponent(component(OwnedByComponentID)).set(testvoxel2, addressToEntity(alice));

    vm.stopPrank();
  }

  function testSpawnCreation() public {
    vm.startPrank(alice);
    // OwnedByComponent(component(OwnedByComponentID)).set(testvoxel, addressToEntity(alice));
    // OwnedByComponent(component(OwnedByComponentID)).set(testvoxel2, addressToEntity(alice));

    // first register the creation
    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    VoxelCoord memory coord1 = VoxelCoord(1, 1, 1);
    VoxelCoord memory coord2 = VoxelCoord(2, 1, 1);
    VoxelCoord memory coord3 = VoxelCoord(5, 5, 5);
    buildSystem.executeTyped(testvoxel, coord1);
    buildSystem.executeTyped(testvoxel2, coord2);

    RegisterCreationSystem registerCreationSystem = RegisterCreationSystem(system(RegisterCreationSystemID));
    SpawnCreationSystem spawnCreationSystem = SpawnCreationSystem(system(SpawnCreationSystemID));

    TransitionRule[] memory rules = new TransitionRule[](1);
    rules[0] = TransitionRule(uint256(blockhash(block.number + 93)), uint256(blockhash(block.number + 97)));
    uint256 creationId = registerCreationSystem.executeTyped("testCreation", coord1, coord2);
    vm.stopPrank();

    // now try to spawn it in
    spawnCreationSystem.executeTyped(creationId, coord3);
  }
}
