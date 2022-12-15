// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { Deploy } from "../Deploy.sol";
import { MudTest } from "std-contracts/test/MudTest.t.sol";
import { StakeSystem, ID as StakeSystemID, getStakeEntity } from "../../systems/StakeSystem.sol";
import { Coord } from "../../types.sol";
import { StakeComponent, ID as StakeComponentID } from "../../components/StakeComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";
import { DiamondID } from "../../prototypes/Blocks.sol";
import { addressToEntity } from "solecs/utils.sol";

contract StakeSystemTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  uint256 diamond1;
  uint256 diamond2;

  function setUp() public override {
    super.setUp();
    vm.startPrank(deployer);

    // Give two diamond blocks to alice
    diamond1 = world.getUniqueEntityId();
    ItemComponent(component(ItemComponentID)).set(diamond1, DiamondID);
    OwnedByComponent(component(OwnedByComponentID)).set(diamond1, addressToEntity(alice));

    diamond2 = world.getUniqueEntityId();
    ItemComponent(component(ItemComponentID)).set(diamond2, DiamondID);
    OwnedByComponent(component(OwnedByComponentID)).set(diamond2, addressToEntity(alice));

    vm.stopPrank();
  }

  function testGetStakeEntityUnique() public {
    assertTrue(getStakeEntity(Coord(0, 0), address(0)) != getStakeEntity(Coord(1, 1), address(0)));
    assertTrue(getStakeEntity(Coord(1, -1), address(0)) != getStakeEntity(Coord(1, 1), address(0)));
    assertTrue(getStakeEntity(Coord(1, -1), address(0)) != getStakeEntity(Coord(-1, 1), address(0)));
    assertTrue(getStakeEntity(Coord(1, -1), address(0)) != getStakeEntity(Coord(-1, -1), address(0)));
    assertTrue(getStakeEntity(Coord(-1, 1), address(0)) != getStakeEntity(Coord(2**31 - 1, 1), address(0)));
    assertTrue(getStakeEntity(Coord(-2**31, 1), address(0)) != getStakeEntity(Coord(2**31 - 1, 1), address(0)));
  }

  function testStake() public {
    vm.startPrank(alice);
    Coord memory chunk = Coord(10, 10);

    // Call the stake system
    StakeSystem(system(StakeSystemID)).executeTyped(diamond1, chunk);

    // Assert the new stake of allice is 1
    uint256 stakeEntity = getStakeEntity(chunk, alice);
    uint32 stake = StakeComponent(component(StakeComponentID)).getValue(stakeEntity);
    assertEq(stake, 1);

    // Call the stake system again
    StakeSystem(system(StakeSystemID)).executeTyped(diamond2, chunk);

    // Assert the new stake of allice is 2
    stake = StakeComponent(component(StakeComponentID)).getValue(stakeEntity);
    assertEq(stake, 2);

    vm.stopPrank();
  }

  function testFailStake() public {
    vm.startPrank(alice);
    Coord memory chunk = Coord(10, 10);

    // Call the stake system
    StakeSystem(system(StakeSystemID)).executeTyped(diamond1, chunk);

    // Assert the new stake of allice is 1
    uint256 stakeEntity = getStakeEntity(chunk, alice);
    uint32 stake = StakeComponent(component(StakeComponentID)).getValue(stakeEntity);
    assertEq(stake, 1);

    // Call the stake system again with the same diamond -> this should fail
    StakeSystem(system(StakeSystemID)).executeTyped(diamond1, chunk);

    vm.stopPrank();
  }

  function testFail() public {
    vm.startPrank(bob);
    Coord memory chunk = Coord(10, 10);

    // Calling the stake system with a block you don't own should fail
    StakeSystem(system(StakeSystemID)).executeTyped(diamond1, chunk);

    vm.stopPrank();
  }
}
