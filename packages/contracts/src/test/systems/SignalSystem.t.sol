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
import { SandID, DiamondID, AirID, StoneID, WaterID, BedrockID, PlanksID, WoolID, PurpleWoolID } from "../../prototypes/Blocks.sol";
import { getChunkEntity } from "../../systems/ClaimSystem.sol";
import { Coord, VoxelCoord, BlockDirection, SignalData } from "../../types.sol";
import { getChunkCoord } from "../../utils.sol";

contract SignalSystemTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  uint256 signalSource;
  uint256 signal;
  uint256 signal2;

  function setUp() public override {
    super.setUp();
    vm.startPrank(deployer);

    // Give a signal source to alice treating purple wool as a source
    signalSource = world.getUniqueEntityId();
    SignalSourceComponent(component(SignalSourceComponentID)).set(signalSource);
    ItemComponent(component(ItemComponentID)).set(signalSource, PurpleWoolID);
    OwnedByComponent(component(OwnedByComponentID)).set(signalSource, addressToEntity(alice));

    // Give 2 signals to alice using white wool was a signal
    signal = world.getUniqueEntityId();
    SignalComponent(component(SignalComponentID)).set(
      signal,
      SignalData({ isActive: false, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(signal, WoolID);
    OwnedByComponent(component(OwnedByComponentID)).set(signal, addressToEntity(alice));

    signal2 = world.getUniqueEntityId();
    SignalComponent(component(SignalComponentID)).set(
      signal2,
      SignalData({ isActive: false, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(signal2, WoolID);
    OwnedByComponent(component(OwnedByComponentID)).set(signal2, addressToEntity(alice));

    vm.stopPrank();
  }

  function testBuildSignalThenSignalSource() public {
    vm.startPrank(alice);

    VoxelCoord memory singalSourceCoord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    VoxelCoord memory signalCoord = VoxelCoord({
      x: singalSourceCoord.x + 1,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air

    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));
    SignalComponent signalComponent = SignalComponent(component(SignalComponentID));

    buildSystem.executeTyped(signal, signalCoord);
    VoxelCoord memory signalPosition = positionComponent.getValue(signal);
    assertEq(signalPosition.x, signalCoord.x);
    assertEq(signalPosition.y, signalCoord.y);
    assertEq(signalPosition.z, signalCoord.z);
    assertTrue(!ownedByComponent.has(signal));

    // make sure signal is not active after being placed down cuz there's no source
    assertTrue(!signalComponent.getValue(signal).isActive);

    buildSystem.executeTyped(signalSource, singalSourceCoord);
    VoxelCoord memory signalSourcePosition = positionComponent.getValue(signalSource);
    assertEq(signalSourcePosition.x, singalSourceCoord.x);
    assertEq(signalSourcePosition.y, singalSourceCoord.y);
    assertEq(signalSourcePosition.z, singalSourceCoord.z);
    assertTrue(!ownedByComponent.has(signalSource));

    // check if signal activated
    assertTrue(signalComponent.getValue(signal).isActive);

    vm.stopPrank();
  }

  function testBuildSignalSourceThenSignal() public {
    vm.startPrank(alice);

    VoxelCoord memory singalSourceCoord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    VoxelCoord memory signalCoord = VoxelCoord({
      x: singalSourceCoord.x + 1,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air

    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));
    SignalComponent signalComponent = SignalComponent(component(SignalComponentID));

    buildSystem.executeTyped(signalSource, singalSourceCoord);
    VoxelCoord memory signalSourcePosition = positionComponent.getValue(signalSource);
    assertEq(signalSourcePosition.x, singalSourceCoord.x);
    assertEq(signalSourcePosition.y, singalSourceCoord.y);
    assertEq(signalSourcePosition.z, singalSourceCoord.z);
    assertTrue(!ownedByComponent.has(signalSource));

    buildSystem.executeTyped(signal, signalCoord);
    VoxelCoord memory signalPosition = positionComponent.getValue(signal);
    assertEq(signalPosition.x, signalCoord.x);
    assertEq(signalPosition.y, signalCoord.y);
    assertEq(signalPosition.z, signalCoord.z);
    assertTrue(!ownedByComponent.has(signal));

    // check if signal activated
    assertTrue(signalComponent.getValue(signal).isActive);

    vm.stopPrank();
  }

  function testBuildMultipleSignalsThenSignalSource() public {
    vm.startPrank(alice);

    VoxelCoord memory singalSourceCoord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    VoxelCoord memory signalCoord = VoxelCoord({
      x: singalSourceCoord.x + 1,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory signal2Coord = VoxelCoord({
      x: singalSourceCoord.x + 2,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air

    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));
    SignalComponent signalComponent = SignalComponent(component(SignalComponentID));

    buildSystem.executeTyped(signal, signalCoord);
    VoxelCoord memory signalPosition = positionComponent.getValue(signal);
    assertEq(signalPosition.x, signalCoord.x);
    assertEq(signalPosition.y, signalCoord.y);
    assertEq(signalPosition.z, signalCoord.z);
    assertTrue(!ownedByComponent.has(signal));

    // make sure signal is not active after being placed down cuz there's no source
    assertTrue(!signalComponent.getValue(signal).isActive);

    buildSystem.executeTyped(signal2, signal2Coord);
    VoxelCoord memory signal2Position = positionComponent.getValue(signal2);
    assertEq(signal2Position.x, signal2Coord.x);
    assertEq(signal2Position.y, signal2Coord.y);
    assertEq(signal2Position.z, signal2Coord.z);
    assertTrue(!ownedByComponent.has(signal2));

    // make sure signal is not active after being placed down cuz there's no source
    assertTrue(!signalComponent.getValue(signal).isActive);
    assertTrue(!signalComponent.getValue(signal2).isActive);

    buildSystem.executeTyped(signalSource, singalSourceCoord);
    VoxelCoord memory signalSourcePosition = positionComponent.getValue(signalSource);
    assertEq(signalSourcePosition.x, singalSourceCoord.x);
    assertEq(signalSourcePosition.y, singalSourceCoord.y);
    assertEq(signalSourcePosition.z, singalSourceCoord.z);
    assertTrue(!ownedByComponent.has(signalSource));

    // check if both signal's are activated
    assertTrue(signalComponent.getValue(signal).isActive);
    assertTrue(signalComponent.getValue(signal2).isActive);

    vm.stopPrank();
  }

  function testBreakSignalSource() public {
    vm.startPrank(alice);

    VoxelCoord memory singalSourceCoord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    VoxelCoord memory signalCoord = VoxelCoord({
      x: singalSourceCoord.x + 1,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air

    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    MineSystem mineSystem = MineSystem(system(MineSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));
    SignalComponent signalComponent = SignalComponent(component(SignalComponentID));

    buildSystem.executeTyped(signal, signalCoord);
    VoxelCoord memory signalPosition = positionComponent.getValue(signal);
    assertEq(signalPosition.x, signalCoord.x);
    assertEq(signalPosition.y, signalCoord.y);
    assertEq(signalPosition.z, signalCoord.z);
    assertTrue(!ownedByComponent.has(signal));

    // make sure signal is not active after being placed down cuz there's no source
    assertTrue(!signalComponent.getValue(signal).isActive);

    buildSystem.executeTyped(signalSource, singalSourceCoord);
    VoxelCoord memory signalSourcePosition = positionComponent.getValue(signalSource);
    assertEq(signalSourcePosition.x, singalSourceCoord.x);
    assertEq(signalSourcePosition.y, singalSourceCoord.y);
    assertEq(signalSourcePosition.z, singalSourceCoord.z);
    assertTrue(!ownedByComponent.has(signalSource));

    // check if signal activated
    assertTrue(signalComponent.getValue(signal).isActive);

    // mine block source
    uint256 minedEntity = mineSystem.executeTyped(singalSourceCoord, PurpleWoolID);
    assertEq(itemComponent.getValue(minedEntity), PurpleWoolID);
    assertEq(ownedByComponent.getValue(minedEntity), addressToEntity(alice));

    // make sure signal is not active after source is mined
    assertTrue(!signalComponent.getValue(signal).isActive);

    vm.stopPrank();
  }
}
