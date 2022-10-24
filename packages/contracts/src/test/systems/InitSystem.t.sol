// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import "../MudTest.t.sol";
import { InitSystem, ID as InitSystemID } from "../../systems/InitSystem.sol";

contract InitSystemTest is MudTest {
  function testExecute() public {
    InitSystem initSystem = InitSystem(system(InitSystemID));
    initSystem.execute(new bytes(0));
  }
}
