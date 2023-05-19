// SPDX-License-Identifier: GPL-3.0

import { Deploy } from "../Deploy.sol";
import { MudTest } from "std-contracts/test/MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { RegisterVoxelTypeSystem, ID as RegisterVoxelTypeSystemID } from "../../systems/RegisterVoxelTypeSystem.sol";
import { TransitionRule } from "../../types.sol";

contract RegisterVoxelTypeTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  function testRegisterVoxelType() public {
    vm.startPrank(alice);
    RegisterVoxelTypeSystem registerVoxelTypeSystem = RegisterVoxelTypeSystem(system(RegisterVoxelTypeSystemID));
    TransitionRule[] memory rules = new TransitionRule[](1);
    rules[0] = TransitionRule(uint256(blockhash(block.number + 93)), uint256(blockhash(block.number + 97)));
    registerVoxelTypeSystem.executeTyped("testVoxel", rules, "#092936");
    vm.stopPrank();
  }
}
