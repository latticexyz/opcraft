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
import { PoweredComponent, ID as PoweredComponentID } from "../../components/PoweredComponent.sol";
import { InvertedSignalComponent, ID as InvertedSignalComponentID } from "../../components/InvertedSignalComponent.sol";

import { SandID, DiamondID, GrassID, AirID, StoneID, WaterID, BedrockID, PlanksID, WoolID, PurpleWoolID } from "../../prototypes/Blocks.sol";
import { getChunkEntity } from "../../systems/ClaimSystem.sol";
import { Coord, VoxelCoord, BlockDirection, SignalData } from "../../types.sol";
import { getChunkCoord } from "../../utils.sol";

contract InvertedSignalSystemTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  uint256 signalSource;
  uint256 signalSource2;
  uint256 signal;
  uint256 signal2;
  uint256 normalBlock;
  uint256 normalBlock2;
  uint256 normalBlock3;
  uint256 invertedSignal;
  uint256 invertedSignal2;
  uint256 invertedSignal3;
  uint256 lastSignal;
  uint256 extraSignal;

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

    normalBlock3 = world.getUniqueEntityId();
    PoweredComponent(component(PoweredComponentID)).set(
      normalBlock3,
      SignalData({ isActive: false, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(normalBlock3, GrassID);
    OwnedByComponent(component(OwnedByComponentID)).set(normalBlock3, addressToEntity(alice));

    invertedSignal = world.getUniqueEntityId();
    InvertedSignalComponent(component(InvertedSignalComponentID)).set(
      invertedSignal,
      SignalData({ isActive: true, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(invertedSignal, PlanksID);
    OwnedByComponent(component(OwnedByComponentID)).set(invertedSignal, addressToEntity(alice));

    invertedSignal2 = world.getUniqueEntityId();
    InvertedSignalComponent(component(InvertedSignalComponentID)).set(
      invertedSignal2,
      SignalData({ isActive: true, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(invertedSignal2, PlanksID);
    OwnedByComponent(component(OwnedByComponentID)).set(invertedSignal2, addressToEntity(alice));

    invertedSignal3 = world.getUniqueEntityId();
    InvertedSignalComponent(component(InvertedSignalComponentID)).set(
      invertedSignal3,
      SignalData({ isActive: true, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(invertedSignal3, PlanksID);
    OwnedByComponent(component(OwnedByComponentID)).set(invertedSignal3, addressToEntity(alice));

    lastSignal = world.getUniqueEntityId();
    SignalComponent(component(SignalComponentID)).set(
      lastSignal,
      SignalData({ isActive: false, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(lastSignal, WoolID);
    OwnedByComponent(component(OwnedByComponentID)).set(lastSignal, addressToEntity(alice));

    extraSignal = world.getUniqueEntityId();
    SignalComponent(component(SignalComponentID)).set(
      extraSignal,
      SignalData({ isActive: false, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(extraSignal, WoolID);
    OwnedByComponent(component(OwnedByComponentID)).set(extraSignal, addressToEntity(alice));

    vm.stopPrank();
  }

  function testNotGate() public {
    vm.startPrank(alice);

    VoxelCoord memory singalSourceCoord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    VoxelCoord memory signal1Coord = VoxelCoord({
      x: singalSourceCoord.x + 1,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory signal2Coord = VoxelCoord({
      x: singalSourceCoord.x + 2,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory lastSignalCoord = VoxelCoord({
      x: singalSourceCoord.x + 5,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory invertedSignalCoord = VoxelCoord({
      x: singalSourceCoord.x + 4,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air
    VoxelCoord memory normalBlockCoord = VoxelCoord({
      x: singalSourceCoord.x + 3,
      y: singalSourceCoord.y,
      z: singalSourceCoord.z
    }); // Air

    BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));
    SignalComponent signalComponent = SignalComponent(component(SignalComponentID));
    PoweredComponent poweredComponent = PoweredComponent(component(PoweredComponentID));
    InvertedSignalComponent invertedSignalComponent = InvertedSignalComponent(component(InvertedSignalComponentID));

    buildSystem.executeTyped(signalSource, singalSourceCoord);
    buildSystem.executeTyped(signal, signal1Coord);
    buildSystem.executeTyped(signal2, signal2Coord);
    buildSystem.executeTyped(lastSignal, lastSignalCoord);
    assertTrue(signalComponent.getValue(signal).isActive);
    assertTrue(signalComponent.getValue(signal2).isActive);
    assertTrue(!signalComponent.getValue(lastSignal).isActive);

    buildSystem.executeTyped(normalBlock, normalBlockCoord);
    assertTrue(poweredComponent.getValue(normalBlock).isActive);
    buildSystem.executeTyped(invertedSignal, invertedSignalCoord);
    assertTrue(poweredComponent.getValue(normalBlock).isActive);
    // the inverted signal will not be active because its beside a powered block
    assertTrue(!invertedSignalComponent.getValue(invertedSignal).isActive);
    // thus the last wire is also not active
    assertTrue(!signalComponent.getValue(lastSignal).isActive);

    // if we remove the signal source, then the powered block should be off, and the inverted signal active
    // and so the last signal is active
    {
      MineSystem mineSystem = MineSystem(system(MineSystemID));
      mineSystem.executeTyped(singalSourceCoord, PurpleWoolID);
    }
    assertTrue(!signalComponent.getValue(signal).isActive);
    assertTrue(!signalComponent.getValue(signal2).isActive);
    assertTrue(invertedSignalComponent.getValue(invertedSignal).isActive);
    assertTrue(signalComponent.getValue(lastSignal).isActive);
    // normal block should be powered
    assertTrue(poweredComponent.getValue(normalBlock).isActive);

    // mine normal block, place wire to connect
    {
      MineSystem mineSystem = MineSystem(system(MineSystemID));
      mineSystem.executeTyped(normalBlockCoord, GrassID);
    }
    buildSystem.executeTyped(extraSignal, normalBlockCoord);
    assertTrue(signalComponent.getValue(extraSignal).isActive);
    assertTrue(signalComponent.getValue(signal).isActive);
    assertTrue(signalComponent.getValue(signal2).isActive);

    vm.stopPrank();
  }

  function testAndGate() public {
    vm.startPrank(alice);

    VoxelCoord memory normalBlockCoord = VoxelCoord({ x: 3275, y: 20, z: 4363 }); // Air
    VoxelCoord memory normalBlockCoord2 = VoxelCoord({
      x: normalBlockCoord.x + 1,
      y: normalBlockCoord.y,
      z: normalBlockCoord.z
    }); // Air
    VoxelCoord memory normalBlockCoord3 = VoxelCoord({
      x: normalBlockCoord.x + 2,
      y: normalBlockCoord.y,
      z: normalBlockCoord.z
    }); // Air

    // on top of middle block
    VoxelCoord memory normalBlockSignalCoord = VoxelCoord({
      x: normalBlockCoord2.x,
      y: normalBlockCoord2.y + 1,
      z: normalBlockCoord2.z
    }); // Air

    VoxelCoord memory invertedSignal2Coord = VoxelCoord({
      x: normalBlockCoord.x,
      y: normalBlockCoord.y + 1,
      z: normalBlockCoord.z
    }); // Air

    VoxelCoord memory invertedSignal3Coord = VoxelCoord({
      x: normalBlockCoord3.x,
      y: normalBlockCoord3.y + 1,
      z: normalBlockCoord3.z
    }); // Air

    VoxelCoord memory invertedSignalCoord = VoxelCoord({
      x: normalBlockCoord2.x,
      y: normalBlockCoord2.y,
      z: normalBlockCoord2.z + 1
    }); //

    VoxelCoord memory signalCoord = VoxelCoord({
      x: normalBlockCoord3.x,
      y: normalBlockCoord3.y,
      z: normalBlockCoord3.z - 1
    }); //

    VoxelCoord memory signal2Coord = VoxelCoord({
      x: normalBlockCoord.x,
      y: normalBlockCoord.y,
      z: normalBlockCoord.z - 1
    }); //

    VoxelCoord memory lastSignalCoord = VoxelCoord({
      x: normalBlockCoord2.x,
      y: normalBlockCoord2.y,
      z: normalBlockCoord2.z + 2
    }); //

    VoxelCoord memory signalSourceCoord = VoxelCoord({ x: signalCoord.x, y: signalCoord.y, z: signalCoord.z - 1 }); //

    VoxelCoord memory signal2SourceCoord = VoxelCoord({ x: signal2Coord.x, y: signal2Coord.y, z: signal2Coord.z - 1 }); //

    // ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    // PositionComponent positionComponent = PositionComponent(component(PositionComponentID));
    // OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));
    // PoweredComponent poweredComponent = PoweredComponent(component(PoweredComponentID));

    {
      BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
      buildSystem.executeTyped(normalBlock, normalBlockCoord);
      buildSystem.executeTyped(normalBlock2, normalBlockCoord2);
      buildSystem.executeTyped(normalBlock3, normalBlockCoord3);
      buildSystem.executeTyped(extraSignal, normalBlockSignalCoord);
      buildSystem.executeTyped(invertedSignal, invertedSignal2Coord);
      buildSystem.executeTyped(invertedSignal2, invertedSignal3Coord);
    }

    SignalComponent signalComponent = SignalComponent(component(SignalComponentID));
    InvertedSignalComponent invertedSignalComponent = InvertedSignalComponent(component(InvertedSignalComponentID));
    PoweredComponent poweredComponent = PoweredComponent(component(PoweredComponentID));
    assertTrue(signalComponent.getValue(extraSignal).isActive);
    assertTrue(invertedSignalComponent.getValue(invertedSignal).isActive);
    assertTrue(invertedSignalComponent.getValue(invertedSignal2).isActive);
    assertTrue(!poweredComponent.getValue(normalBlock).isActive);
    assertTrue(!poweredComponent.getValue(normalBlock3).isActive);
    assertTrue(poweredComponent.getValue(normalBlock2).isActive);

    {
      BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
      buildSystem.executeTyped(invertedSignal3, invertedSignalCoord);
      buildSystem.executeTyped(lastSignal, lastSignalCoord);
    }
    assertTrue(!invertedSignalComponent.getValue(invertedSignal3).isActive);
    assertTrue(!signalComponent.getValue(lastSignal).isActive);

    {
      BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
      buildSystem.executeTyped(signal, signalCoord);
      buildSystem.executeTyped(signal2, signal2Coord);
    }
    assertTrue(!signalComponent.getValue(signal).isActive);
    assertTrue(!signalComponent.getValue(signal2).isActive);

    // with no input sources, output should be 0
    assertTrue(!signalComponent.getValue(lastSignal).isActive);

    // add input source to 1
    {
      BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
      buildSystem.executeTyped(signalSource, signalSourceCoord);
    }
    // assert output is still 0
    assertTrue(signalComponent.getValue(signal).isActive);
    assertTrue(!signalComponent.getValue(lastSignal).isActive);

    // add another input source
    {
      BuildSystem buildSystem = BuildSystem(system(BuildSystemID));
      buildSystem.executeTyped(signalSource2, signal2SourceCoord);
    }
    // assert output is now 1
    assertTrue(signalComponent.getValue(signal).isActive);
    assertTrue(signalComponent.getValue(signal2).isActive);
    assertTrue(signalComponent.getValue(lastSignal).isActive);

    vm.stopPrank();
  }
}
