// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { Deploy } from "../Deploy.sol";
import { MudTest } from "std-contracts/test/MudTest.t.sol";
import { Coord } from "../../types.sol";
import { TransferSystem, ID as TransferSystemID } from "../../systems/TransferSystem.sol";
import { ItemComponent, ID as ItemComponentID } from "../../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";
import { DiamondID } from "../../prototypes/Blocks.sol";
import { addressToEntity } from "solecs/utils.sol";

contract TransferSystemTest is MudTest {
  constructor() MudTest(new Deploy()) {}

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

  function testTransfer() public {
    vm.startPrank(alice);

    // Assert the diamond is owned by Alice
    assertEq(OwnedByComponent(component(OwnedByComponentID)).getValue(diamond), addressToEntity(alice));

    // Call the transfer system
    TransferSystem(system(TransferSystemID)).executeTyped(diamond, addressToEntity(bob));

    // Assert the diamond is owned by Bob
    assertEq(OwnedByComponent(component(OwnedByComponentID)).getValue(diamond), addressToEntity(bob));

    vm.stopPrank();
  }

  function testFailTransfer() public {
    vm.startPrank(bob);

    // Call the transfer system -> should fail because Bob does not own the diamond
    TransferSystem(system(TransferSystemID)).executeTyped(diamond, addressToEntity(alice));

    vm.stopPrank();
  }
}
