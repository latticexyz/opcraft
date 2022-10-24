// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import "../MudTest.t.sol";

contract GameConfigSystemTest is MudTest {
  function testExecute() public {
    vm.startPrank(deployer);
    console.log(deployer);
    // GameConfigSystem(system(sysID)).execute(new bytes(0));
    // GameConfigComponent gameConfigComponent = GameConfigComponent(component(compID));
    // assertTrue(gameConfigComponent.getRawValue(GodID).length != 0);
    vm.stopPrank();
  }

  function testRequirement() public {
    vm.startPrank(deployer);
    // GameConfigSystem(system(sysID)).requirement(new bytes(0));
    vm.stopPrank();
  }

  function testFailRequirement() public {
    vm.startPrank(alice);
    revert();
    // GameConfigSystem(system(sysID)).requirement(new bytes(0));
    vm.stopPrank();
  }
}
