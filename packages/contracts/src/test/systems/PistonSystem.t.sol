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
import { SignalComponent, ID as SignalComponentID } from "../../components/SignalComponent.sol";
import { SignalSourceComponent, ID as SignalSourceComponentID } from "../../components/SignalSourceComponent.sol";
import { PistonComponent, ID as PistonComponentID, PistonData, HEAD_EXTEND_DIRECTION } from "../../components/PistonComponent.sol";
import { PoweredComponent, ID as PoweredComponentID } from "../../components/PoweredComponent.sol";
import { InvertedSignalComponent, ID as InvertedSignalComponentID } from "../../components/InvertedSignalComponent.sol";

import { SandID, DiamondID, GrassID, AirID, StoneID, WaterID, BedrockID, PlanksID, WoolID, PurpleWoolID, LogID } from "../../prototypes/Blocks.sol";
import { getChunkEntity } from "../../systems/ClaimSystem.sol";
import { Coord, VoxelCoord, BlockDirection, SignalData } from "../../types.sol";
import { getChunkCoord, getVoxelCoordInDirection } from "../../utils.sol";

contract PistonSystemTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  uint256 signalSource;
  uint256 signalSource2;
  uint256 pistonBlock;
  uint256 normalBlock;
  uint256 normalBlock2;

  function setUp() public override {
    super.setUp();
    vm.startPrank(deployer);

    // Give a signal source to alice treating purple wool as a source
    signalSource = world.getUniqueEntityId();
    SignalSourceComponent(component(SignalSourceComponentID)).set(signalSource, true);
    ItemComponent(component(ItemComponentID)).set(signalSource, PurpleWoolID);
    OwnedByComponent(component(OwnedByComponentID)).set(signalSource, addressToEntity(alice));

    signalSource2 = world.getUniqueEntityId();
    SignalSourceComponent(component(SignalSourceComponentID)).set(signalSource2, true);
    ItemComponent(component(ItemComponentID)).set(signalSource2, PurpleWoolID);
    OwnedByComponent(component(OwnedByComponentID)).set(signalSource2, addressToEntity(alice));

    pistonBlock = world.getUniqueEntityId();
    PoweredComponent(component(PoweredComponentID)).set(
      pistonBlock,
      SignalData({ isActive: false, direction: BlockDirection.None })
    );
    PistonComponent(component(PistonComponentID)).set(
      pistonBlock,
      PistonData({ isExtended: false, maxNumBlocksMove: 1 })
    );
    ItemComponent(component(ItemComponentID)).set(pistonBlock, LogID);
    OwnedByComponent(component(OwnedByComponentID)).set(pistonBlock, addressToEntity(alice));

    normalBlock = world.getUniqueEntityId();
    PoweredComponent(component(PoweredComponentID)).set(
      normalBlock,
      SignalData({ isActive: false, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(normalBlock, GrassID);
    OwnedByComponent(component(OwnedByComponentID)).set(normalBlock, addressToEntity(alice));

    normalBlock2 = world.getUniqueEntityId();
    PoweredComponent(component(PoweredComponentID)).set(
      normalBlock2,
      SignalData({ isActive: false, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(normalBlock2, GrassID);
    OwnedByComponent(component(OwnedByComponentID)).set(normalBlock2, addressToEntity(alice));

    vm.stopPrank();
  }

  function testPistonPushBlock() public {
    vm.startPrank(alice);

    VoxelCoord memory singalSourceCoord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    VoxelCoord memory pistonBlockCoord = VoxelCoord({
      x: singalSourceCoord.x + 1,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory normalBlockCoord = VoxelCoord({
      x: singalSourceCoord.x + 2,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory airCoord = VoxelCoord({
      x: singalSourceCoord.x + 3,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air

    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));
    PoweredComponent poweredComponent = PoweredComponent(component(PoweredComponentID));
    PistonComponent pistonComponent = PistonComponent(component(PistonComponentID));
    MineSystem mineSystem = MineSystem(system(MineSystemID));

    buildSystem.executeTyped(normalBlock2, airCoord);
    mineSystem.executeTyped(airCoord, GrassID);
    uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(airCoord);
    assertTrue(entitiesAtPosition.length == 1);
    uint256 airEntity = entitiesAtPosition[0];
    assertTrue(itemComponent.getValue(airEntity) == AirID);
    buildSystem.executeTyped(normalBlock, normalBlockCoord);
    buildSystem.executeTyped(pistonBlock, pistonBlockCoord);
    assertTrue(!poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(!pistonComponent.getValue(pistonBlock).isExtended); // not extended yet

    assertTrue(getVoxelCoordInDirection(pistonBlockCoord, HEAD_EXTEND_DIRECTION, 1).x == normalBlockCoord.x);
    assertTrue(getVoxelCoordInDirection(pistonBlockCoord, HEAD_EXTEND_DIRECTION, 2).x == airCoord.x);

    // put down the signal source
    assertTrue(itemComponent.getValue(normalBlock) == GrassID);
    buildSystem.executeTyped(signalSource, singalSourceCoord);
    assertTrue(poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(pistonComponent.getValue(pistonBlock).isExtended); // extended now
    // assert that the block in front of it has no moved by one in X and at the airCoord
    entitiesAtPosition = positionComponent.getEntitiesWithValue(airCoord);
    assertTrue(entitiesAtPosition.length == 1);
    assertTrue(entitiesAtPosition[0] == normalBlock);
    assertTrue(itemComponent.getValue(normalBlock) == GrassID);

    // assert block at normalBlockCoord is now piston head
    entitiesAtPosition = positionComponent.getEntitiesWithValue(normalBlockCoord);
    assertTrue(entitiesAtPosition.length == 1);
    assertTrue(itemComponent.getValue(entitiesAtPosition[0]) == BedrockID);

    // break the source and assert the bedrock is gone
    mineSystem.executeTyped(singalSourceCoord, PurpleWoolID);
    assertTrue(!poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(!pistonComponent.getValue(pistonBlock).isExtended); // not extended yet
    entitiesAtPosition = positionComponent.getEntitiesWithValue(normalBlockCoord);
    assertTrue(entitiesAtPosition.length == 1);
    assertTrue(itemComponent.getValue(entitiesAtPosition[0]) == AirID);
  }

  function testPistonPushNothing() public {
    vm.startPrank(alice);

    VoxelCoord memory singalSourceCoord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    VoxelCoord memory pistonBlockCoord = VoxelCoord({
      x: singalSourceCoord.x + 1,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory airCoord = VoxelCoord({
      x: singalSourceCoord.x + 2,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air

    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));
    PoweredComponent poweredComponent = PoweredComponent(component(PoweredComponentID));
    PistonComponent pistonComponent = PistonComponent(component(PistonComponentID));
    MineSystem mineSystem = MineSystem(system(MineSystemID));

    buildSystem.executeTyped(normalBlock2, airCoord);
    mineSystem.executeTyped(airCoord, GrassID);
    uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(airCoord);
    assertTrue(entitiesAtPosition.length == 1);
    uint256 airEntity = entitiesAtPosition[0];
    assertTrue(itemComponent.getValue(airEntity) == AirID);
    buildSystem.executeTyped(pistonBlock, pistonBlockCoord);
    assertTrue(!poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(!pistonComponent.getValue(pistonBlock).isExtended); // not extended yet

    // put down the signal source
    buildSystem.executeTyped(signalSource, singalSourceCoord);
    assertTrue(poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(pistonComponent.getValue(pistonBlock).isExtended); // extended now
    // assert that the block in front of it has no moved by one in X and at the airCoord
    entitiesAtPosition = positionComponent.getEntitiesWithValue(airCoord);
    assertTrue(entitiesAtPosition.length == 1);
    assertTrue(entitiesAtPosition[0] == airEntity);
    assertTrue(itemComponent.getValue(airEntity) == BedrockID);

    // break the source and assert the bedrock is gone
    mineSystem.executeTyped(singalSourceCoord, PurpleWoolID);
    assertTrue(!poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(!pistonComponent.getValue(pistonBlock).isExtended); // not extended yet
    entitiesAtPosition = positionComponent.getEntitiesWithValue(airCoord);
    assertTrue(entitiesAtPosition.length == 1);
    assertTrue(itemComponent.getValue(entitiesAtPosition[0]) == AirID);
  }

  function testPistonCannotPushBlock() public {
    vm.startPrank(alice);

    VoxelCoord memory singalSourceCoord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    VoxelCoord memory pistonBlockCoord = VoxelCoord({
      x: singalSourceCoord.x + 1,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory normalBlockCoord = VoxelCoord({
      x: singalSourceCoord.x + 2,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory normalBlock2Coord = VoxelCoord({
      x: singalSourceCoord.x + 3,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air

    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    PoweredComponent poweredComponent = PoweredComponent(component(PoweredComponentID));
    PistonComponent pistonComponent = PistonComponent(component(PistonComponentID));
    MineSystem mineSystem = MineSystem(system(MineSystemID));

    buildSystem.executeTyped(normalBlock2, normalBlock2Coord);
    buildSystem.executeTyped(normalBlock, normalBlockCoord);
    buildSystem.executeTyped(pistonBlock, pistonBlockCoord);
    assertTrue(!poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(!pistonComponent.getValue(pistonBlock).isExtended); // not extended yet

    // put down the signal source
    buildSystem.executeTyped(signalSource, singalSourceCoord);
    assertTrue(poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(!pistonComponent.getValue(pistonBlock).isExtended); // extended now

    mineSystem.executeTyped(normalBlockCoord, GrassID);
    uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(normalBlockCoord);
    assertTrue(entitiesAtPosition.length == 1);
    uint256 pistonHeadEntity = entitiesAtPosition[0];
    assertTrue(itemComponent.getValue(pistonHeadEntity) == BedrockID);
  }

  function testPistonMultipleSource() public {
    vm.startPrank(alice);

    VoxelCoord memory singalSourceCoord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    VoxelCoord memory pistonBlockCoord = VoxelCoord({
      x: singalSourceCoord.x + 1,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory singalSource2Coord = VoxelCoord({
      x: pistonBlockCoord.x,
      y: pistonBlockCoord.y + 1,
      z: pistonBlockCoord.z
    }); // Air
    VoxelCoord memory airCoord = VoxelCoord({
      x: singalSourceCoord.x + 2,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air

    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));
    PoweredComponent poweredComponent = PoweredComponent(component(PoweredComponentID));
    PistonComponent pistonComponent = PistonComponent(component(PistonComponentID));
    MineSystem mineSystem = MineSystem(system(MineSystemID));

    buildSystem.executeTyped(normalBlock2, airCoord);
    mineSystem.executeTyped(airCoord, GrassID);
    uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(airCoord);
    assertTrue(entitiesAtPosition.length == 1);
    uint256 airEntity = entitiesAtPosition[0];
    assertTrue(itemComponent.getValue(airEntity) == AirID);
    buildSystem.executeTyped(pistonBlock, pistonBlockCoord);
    assertTrue(!poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(!pistonComponent.getValue(pistonBlock).isExtended); // not extended yet

    // put down the signal source
    buildSystem.executeTyped(signalSource, singalSourceCoord);
    assertTrue(poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(pistonComponent.getValue(pistonBlock).isExtended); // extended now
    // assert that the block in front of it has no moved by one in X and at the airCoord
    entitiesAtPosition = positionComponent.getEntitiesWithValue(airCoord);
    assertTrue(entitiesAtPosition.length == 1);
    assertTrue(entitiesAtPosition[0] == airEntity);
    assertTrue(itemComponent.getValue(airEntity) == BedrockID);

    buildSystem.executeTyped(signalSource2, singalSource2Coord);
    assertTrue(poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(pistonComponent.getValue(pistonBlock).isExtended); // extended now
    entitiesAtPosition = positionComponent.getEntitiesWithValue(airCoord);
    assertTrue(entitiesAtPosition.length == 1);
    assertTrue(entitiesAtPosition[0] == airEntity);
    assertTrue(itemComponent.getValue(airEntity) == BedrockID);

    // break the source and assert the bedrock is gone
    mineSystem.executeTyped(singalSourceCoord, PurpleWoolID);
    assertTrue(poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(pistonComponent.getValue(pistonBlock).isExtended); // extended now
    entitiesAtPosition = positionComponent.getEntitiesWithValue(airCoord);
    assertTrue(entitiesAtPosition.length == 1);
    assertTrue(entitiesAtPosition[0] == airEntity);
    assertTrue(itemComponent.getValue(airEntity) == BedrockID);

    mineSystem.executeTyped(singalSource2Coord, PurpleWoolID);
    assertTrue(!poweredComponent.getValue(pistonBlock).isActive);
    assertTrue(!pistonComponent.getValue(pistonBlock).isExtended); // not extended yet
    entitiesAtPosition = positionComponent.getEntitiesWithValue(airCoord);
    assertTrue(entitiesAtPosition.length == 1);
    assertTrue(itemComponent.getValue(entitiesAtPosition[0]) == AirID);
  }
}
