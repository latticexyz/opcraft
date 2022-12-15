// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { Deploy } from "../Deploy.sol";
import { MudTest } from "std-contracts/test/MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { CraftSystem, ID as CraftSystemID } from "../../systems/CraftSystem.sol";
import { ItemComponent, ID as ItemComponentID } from "../../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";
import { PlanksID, CraftingID, LogID } from "../../prototypes/Blocks.sol";
import { initializeArray } from "../../utils.sol";

contract CraftSystemTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  uint256[] internal planks;
  uint256 logBlock;

  function setUp() public override {
    super.setUp();
    vm.startPrank(deployer);
    planks = new uint256[](4);
    // Give 4 planks blocks to alice
    for (uint256 i; i < 4; i++) {
      planks[i] = world.getUniqueEntityId();
      ItemComponent(component(ItemComponentID)).set(planks[i], PlanksID);
      OwnedByComponent(component(OwnedByComponentID)).set(planks[i], addressToEntity(alice));
    }

    // Give one log block to alice
    logBlock = world.getUniqueEntityId();
    ItemComponent(component(ItemComponentID)).set(logBlock, LogID);
    OwnedByComponent(component(OwnedByComponentID)).set(logBlock, addressToEntity(alice));

    vm.stopPrank();
  }

  function testCraftCrafting() public {
    vm.startPrank(alice);
    CraftSystem craftSystem = CraftSystem(system(CraftSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));

    uint256[][] memory ingredients = initializeArray(2, 2);
    ingredients[0][0] = planks[0];
    ingredients[0][1] = planks[1];
    ingredients[1][0] = planks[2];
    ingredients[1][1] = planks[3];

    uint256 craftedEntity = craftSystem.executeTyped(ingredients);
    assertEq(ownedByComponent.getValue(craftedEntity), addressToEntity(alice));
    assertEq(itemComponent.getValue(craftedEntity), CraftingID);
    assertTrue(!ownedByComponent.has(planks[0]));
    assertTrue(!ownedByComponent.has(planks[1]));
    assertTrue(!ownedByComponent.has(planks[2]));
    assertTrue(!ownedByComponent.has(planks[3]));
    vm.stopPrank();
  }

  function testCraftPlanks() public {
    vm.startPrank(alice);
    CraftSystem craftSystem = CraftSystem(system(CraftSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));

    uint256[][] memory ingredients = initializeArray(1, 1);
    ingredients[0][0] = logBlock;

    uint256 craftedEntity = craftSystem.executeTyped(ingredients);
    assertEq(ownedByComponent.getValue(craftedEntity), addressToEntity(alice));
    assertEq(itemComponent.getValue(craftedEntity), PlanksID);
    assertTrue(!ownedByComponent.has(logBlock));
    vm.stopPrank();
  }

  function testFailCraftNotOwned() public {
    vm.startPrank(bob);
    CraftSystem craftSystem = CraftSystem(system(CraftSystemID));
    ItemComponent itemComponent = ItemComponent(component(ItemComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(component(OwnedByComponentID));

    uint256[][] memory ingredients = initializeArray(1, 1);
    ingredients[0][0] = logBlock;

    uint256 craftedEntity = craftSystem.executeTyped(ingredients);
    vm.stopPrank();
  }
}
