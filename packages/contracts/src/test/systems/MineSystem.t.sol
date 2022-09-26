// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../MudTest.t.sol";
import { MineSystem, ID as MineSystemID } from "../../systems/MineSystem.sol";
import { ItemComponent, ID as ItemComponentID } from "../../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";
import { PositionComponent, ID as PositionComponentID, VoxelCoord } from "../../components/PositionComponent.sol";
import { SandID, DiamondID, AirID, StoneID, WaterID } from "../../prototypes/Blocks.sol";
import { addressToEntity } from "solecs/utils.sol";

contract MineSystemTest is MudTest {
  function testMineTerrain() public {
    vm.startPrank(alice);
    MineSystem mineSystem = MineSystem(system(MineSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));

    VoxelCoord memory coord = VoxelCoord({ x: -1598, y: 10, z: 4650 }); // Sand
    uint256 minedEntity = mineSystem.executeTyped(coord, SandID);

    assertEq(itemComponent.getValue(minedEntity), SandID);
    assertEq(ownedByComponent.getValue(minedEntity), addressToEntity(alice));
    vm.stopPrank();
  }

  function testFailWrongBlockTerrain() public {
    vm.startPrank(alice);
    MineSystem mineSystem = MineSystem(system(MineSystemID));
    VoxelCoord memory coord = VoxelCoord({ x: -1598, y: 10, z: 4650 }); // Sand
    uint256 minedEntity = mineSystem.executeTyped(coord, DiamondID);
    vm.stopPrank();
  }

  function testMineECS() public {
    // Place a diamond at this coord
    vm.startPrank(deployer);

    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    VoxelCoord memory coord = VoxelCoord({ x: -1598, y: 10, z: 4650 });

    uint256 blockEntity = uint256(keccak256("entity"));
    itemComponent.set(blockEntity, DiamondID);
    positionComponent.set(blockEntity, coord);

    vm.stopPrank();
    vm.startPrank(alice);

    MineSystem mineSystem = MineSystem(system(MineSystemID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));

    uint256 minedEntity = mineSystem.executeTyped(coord, DiamondID);

    assertEq(minedEntity, blockEntity);
    assertEq(itemComponent.getValue(minedEntity), DiamondID);
    assertTrue(!positionComponent.has(minedEntity));
    assertEq(ownedByComponent.getValue(minedEntity), addressToEntity(alice));
    vm.stopPrank();
  }

  function testMineECSAvoidAir() public {
    vm.startPrank(deployer);

    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    VoxelCoord memory coord = VoxelCoord({ x: -1598, y: 10, z: 4650 });

    uint256 airEntity1 = uint256(keccak256("air1"));
    itemComponent.set(airEntity1, AirID);
    positionComponent.set(airEntity1, coord);

    uint256 blockEntity = uint256(keccak256("entity"));
    itemComponent.set(blockEntity, DiamondID);
    positionComponent.set(blockEntity, coord);

    uint256 airEntity2 = uint256(keccak256("air2"));
    itemComponent.set(airEntity2, AirID);
    positionComponent.set(airEntity2, coord);

    vm.stopPrank();
    vm.startPrank(alice);

    MineSystem mineSystem = MineSystem(system(MineSystemID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));

    uint256 minedEntity = mineSystem.executeTyped(coord, DiamondID);

    assertEq(minedEntity, blockEntity);
    assertEq(itemComponent.getValue(minedEntity), DiamondID);
    assertTrue(!positionComponent.has(minedEntity));
    assertEq(ownedByComponent.getValue(minedEntity), addressToEntity(alice));
    vm.stopPrank();
  }

  function testFailMineECS() public {
    // Place a diamond at this coord
    vm.startPrank(deployer);

    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    VoxelCoord memory coord = VoxelCoord({ x: -1598, y: 10, z: 4650 });

    uint256 blockEntity = uint256(keccak256("entity"));
    itemComponent.set(blockEntity, DiamondID);
    positionComponent.set(blockEntity, coord);

    vm.stopPrank();
    vm.startPrank(alice);

    MineSystem mineSystem = MineSystem(system(MineSystemID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));

    uint256 minedEntity = mineSystem.executeTyped(coord, SandID);

    vm.stopPrank();
  }

  function testInsideBounds() public {
    vm.startPrank(alice);
    MineSystem mineSystem = MineSystem(system(MineSystemID));
    VoxelCoord memory coord = VoxelCoord({ x: -1598, y: -255, z: 4650 });
    uint256 minedEntity = mineSystem.executeTyped(coord, StoneID);
    vm.stopPrank();
  }

  function testFailOutOfBounds() public {
    vm.startPrank(alice);
    MineSystem mineSystem = MineSystem(system(MineSystemID));
    VoxelCoord memory coord = VoxelCoord({ x: -1598, y: -256, z: 4650 });
    uint256 minedEntity = mineSystem.executeTyped(coord, StoneID);
    vm.stopPrank();
  }

  function testFailMineAir() public {
    vm.startPrank(alice);
    MineSystem mineSystem = MineSystem(system(MineSystemID));
    VoxelCoord memory coord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    uint256 minedEntity = mineSystem.executeTyped(coord, AirID);
    vm.stopPrank();
  }

  function testFailMineWater() public {
    vm.startPrank(alice);
    MineSystem mineSystem = MineSystem(system(MineSystemID));

    VoxelCoord memory coord = VoxelCoord({ x: 5974, y: -13, z: 8968 }); // Water
    uint256 minedEntity = mineSystem.executeTyped(coord, WaterID);
    vm.stopPrank();
  }
}
