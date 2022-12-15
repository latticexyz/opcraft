// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { Deploy } from "../Deploy.sol";
import { MudTest } from "std-contracts/test/MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { BuildSystem, ID as BuildSystemID } from "../../systems/BuildSystem.sol";
import { MineSystem, ID as MineSystemID } from "../../systems/MineSystem.sol";
import { ItemComponent, ID as ItemComponentID } from "../../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { ClaimComponent, ID as ClaimComponentID, Claim } from "../../components/ClaimComponent.sol";
import { SandID, DiamondID, AirID, StoneID, WaterID, BedrockID, PlanksID } from "../../prototypes/Blocks.sol";
import { getChunkEntity } from "../../systems/ClaimSystem.sol";
import { Coord, VoxelCoord } from "../../types.sol";
import { getChunkCoord } from "../../utils.sol";

contract BuildSystemTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  uint256 planks;
  uint256 planks2;

  function setUp() public override {
    super.setUp();
    vm.startPrank(deployer);

    // Give 2 planks blocks to alice
    planks = world.getUniqueEntityId();
    ItemComponent(component(ItemComponentID)).set(planks, PlanksID);
    OwnedByComponent(component(OwnedByComponentID)).set(planks, addressToEntity(alice));

    planks2 = world.getUniqueEntityId();
    ItemComponent(component(ItemComponentID)).set(planks2, PlanksID);
    OwnedByComponent(component(OwnedByComponentID)).set(planks2, addressToEntity(alice));

    vm.stopPrank();
  }

  function testBuild() public {
    vm.startPrank(alice);

    VoxelCoord memory coord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air

    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));

    buildSystem.executeTyped(planks, coord);

    VoxelCoord memory position = positionComponent.getValue(planks);
    assertEq(position.x, coord.x);
    assertEq(position.y, coord.y);
    assertEq(position.z, coord.z);

    assertTrue(!ownedByComponent.has(planks));
    vm.stopPrank();
  }

  function testFailBuildNonOwned() public {
    vm.startPrank(bob);

    VoxelCoord memory coord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    buildSystem.executeTyped(planks, coord);

    vm.stopPrank();
  }

  function testBuildTwice() public {
    vm.startPrank(alice);

    VoxelCoord memory coord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    buildSystem.executeTyped(planks, coord);

    coord = VoxelCoord({ x: 3275, y: 21, z: 4363 }); // Air
    buildSystem.executeTyped(planks2, coord);

    vm.stopPrank();
  }

  function testFailBuildTwiceSameBlock() public {
    vm.startPrank(alice);

    VoxelCoord memory coord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    buildSystem.executeTyped(planks, coord);

    coord = VoxelCoord({ x: 3275, y: 21, z: 4363 }); // Air
    buildSystem.executeTyped(planks, coord);

    vm.stopPrank();
  }

  function testFailBuildTwiceSameCoord() public {
    vm.startPrank(alice);

    VoxelCoord memory coord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    buildSystem.executeTyped(planks, coord);
    buildSystem.executeTyped(planks2, coord);

    vm.stopPrank();
  }

  function testBuildClaimed() public {
    VoxelCoord memory coord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air

    // Set claim in chunk to alice
    vm.startPrank(deployer);
    ClaimComponent claimComponent = ClaimComponent(component(ClaimComponentID));
    Coord memory chunk = getChunkCoord(coord);
    uint256 chunkEntity = getChunkEntity(chunk);
    claimComponent.set(chunkEntity, Claim(10, addressToEntity(alice)));
    vm.stopPrank();

    vm.startPrank(alice);
    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    buildSystem.executeTyped(planks, coord);
    vm.stopPrank();
  }

  function testFailBuildClaimed() public {
    VoxelCoord memory coord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air

    // Set claim in chunk to alice
    vm.startPrank(deployer);
    ClaimComponent claimComponent = ClaimComponent(component(ClaimComponentID));
    Coord memory chunk = getChunkCoord(coord);
    uint256 chunkEntity = getChunkEntity(chunk);
    claimComponent.set(chunkEntity, Claim(10, addressToEntity(bob)));
    vm.stopPrank();

    vm.startPrank(alice);
    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    buildSystem.executeTyped(planks, coord);
    vm.stopPrank();
  }
}
