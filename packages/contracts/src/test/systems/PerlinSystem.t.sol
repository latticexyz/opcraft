// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../MudTest.t.sol";
import { Perlin } from "noise/Perlin.sol";
import { PerlinSystem, ID as PerlinSystemID, Coord } from "../../systems/PerlinSystem.sol";

contract PerlinSystemTest is MudTest {
  function testExecute() public {
    int128 perlin = PerlinSystem(system(PerlinSystemID)).executeTyped(Coord(10, 10));
    assertEq(perlin, Perlin.noise(10, 10, 0, 7, 10));
  }
}
