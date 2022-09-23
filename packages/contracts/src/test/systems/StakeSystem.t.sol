// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../MudTest.t.sol";
import { StakeSystem, ID as StakeSystemID, getStakeEntity } from "../../systems/StakeSystem.sol";
import { Coord } from "../../types.sol";
import { StakeComponent, ID as StakeComponentID } from "../../components/StakeComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";
import { DiamondID } from "../../prototypes/Blocks.sol";
import { addressToEntity } from "solecs/utils.sol";

contract StakeSystemTest is MudTest {
  uint256 diamond;

  function setUp() public override {
    super.setUp();
    vm.startPrank(deployer);

    // Give a diamond block to alice
    diamond = world.getUniqueEntityId();
    ItemComponent(component(ItemComponentID)).set(diamond, DiamondID);
    OwnedByComponent(component(OwnedByComponentID)).set(diamond, addressToEntity(alice));

    vm.stopPrank();
  }

  function testExecute() public {
    vm.startPrank(alice);
    Coord memory chunk = Coord(10, 10);

    // Call the stake system
    StakeSystem(system(StakeSystemID)).executeTyped(diamond, chunk);

    // Assert the new stake of allice is 1
    uint256 stakeEntity = getStakeEntity(chunk, alice);
    uint256 stake = StakeComponent(component(StakeComponentID)).getValue(stakeEntity);
    assertEq(stake, 1);

    vm.stopPrank();
  }

  function testFail() public {
    vm.startPrank(bob);
    Coord memory chunk = Coord(10, 10);

    // Calling the stake system with a block you don't own should fail
    StakeSystem(system(StakeSystemID)).executeTyped(diamond, chunk);

    vm.stopPrank();
  }
}
