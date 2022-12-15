// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { Deploy } from "../Deploy.sol";
import { MudTest } from "std-contracts/test/MudTest.t.sol";
import { getStakeEntity } from "../../systems/StakeSystem.sol";
import { ClaimSystem, ID as ClaimSystemID, Claim, getChunkEntity } from "../../systems/ClaimSystem.sol";
import { Coord } from "../../types.sol";
import { StakeComponent, ID as StakeComponentID } from "../../components/StakeComponent.sol";
import { ClaimComponent, ID as ClaimComponentID } from "../../components/ClaimComponent.sol";
import { addressToEntity } from "solecs/utils.sol";

contract ClaimSystemTest is MudTest {
  constructor() MudTest(new Deploy()) {}

  Coord internal chunk = Coord(12, -13);

  function setUp() public override {
    super.setUp();
    vm.startPrank(deployer);

    // Set alices's stake in chunk to 7
    uint256 stakeEntity = getStakeEntity(chunk, alice);
    StakeComponent(component(StakeComponentID)).set(stakeEntity, 7);

    // Set bob's stake in chunk to 5
    stakeEntity = getStakeEntity(chunk, bob);
    StakeComponent(component(StakeComponentID)).set(stakeEntity, 5);

    vm.stopPrank();
  }

  function testClaimUnclaimedChunk() public {
    vm.startPrank(bob);

    // Claim the chunk
    ClaimSystem(system(ClaimSystemID)).executeTyped(chunk);

    // Assert chunk is claimed by bob
    Claim memory claim = ClaimComponent(component(ClaimComponentID)).getValue(getChunkEntity(chunk));
    assertEq(claim.stake, 5);
    assertEq(claim.claimer, addressToEntity(bob));

    vm.stopPrank();
  }

  function testClaimClaimedChunk() public {
    vm.startPrank(bob);

    // Bob claims the chunk
    ClaimSystem(system(ClaimSystemID)).executeTyped(chunk);

    // Assert chunk is claimed by bob
    Claim memory claim = ClaimComponent(component(ClaimComponentID)).getValue(getChunkEntity(chunk));
    assertEq(claim.stake, 5);
    assertEq(claim.claimer, addressToEntity(bob));

    vm.stopPrank();

    vm.startPrank(alice);

    // Alice claims the chunk
    ClaimSystem(system(ClaimSystemID)).executeTyped(chunk);

    // Assert chunk is claimed by alice now
    claim = ClaimComponent(component(ClaimComponentID)).getValue(getChunkEntity(chunk));
    assertEq(claim.stake, 7);
    assertEq(claim.claimer, addressToEntity(alice));

    vm.stopPrank();
  }

  function testFailClaimClaimedChunk() public {
    vm.startPrank(alice);

    // Alice claims the chunk
    ClaimSystem(system(ClaimSystemID)).executeTyped(chunk);

    // Assert chunk is claimed by bob
    Claim memory claim = ClaimComponent(component(ClaimComponentID)).getValue(getChunkEntity(chunk));
    assertEq(claim.stake, 7);
    assertEq(claim.claimer, addressToEntity(alice));

    vm.stopPrank();

    vm.startPrank(bob);

    // Bob tries to claim the chunk -> this should fail because he does not have enough stake
    ClaimSystem(system(ClaimSystemID)).executeTyped(chunk);

    vm.stopPrank();
  }
}
