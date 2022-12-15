// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { Deploy } from "../Deploy.sol";
import { MudTest } from "std-contracts/test/MudTest.t.sol";
import { InitSystem, ID as InitSystemID } from "../../systems/InitSystem.sol";

contract InitSystemTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  function testExecute() public {
    InitSystem initSystem = InitSystem(system(InitSystemID));
    initSystem.execute(new bytes(0));
  }
}
