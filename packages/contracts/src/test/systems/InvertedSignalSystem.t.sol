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
  uint256 signal;
  uint256 signal2;
  uint256 normalBlock;
  uint256 invertedSignal;
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

    invertedSignal = world.getUniqueEntityId();
    InvertedSignalComponent(component(InvertedSignalComponentID)).set(
      invertedSignal,
      SignalData({ isActive: true, direction: BlockDirection.None })
    );
    ItemComponent(component(ItemComponentID)).set(invertedSignal, PlanksID);
    OwnedByComponent(component(OwnedByComponentID)).set(invertedSignal, addressToEntity(alice));

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
}
