// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

// Foundry
import { DSTest } from "ds-test/test.sol";
import { Cheats } from "./Cheats.sol";

// Solecs
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { ISystem } from "solecs/interfaces/ISystem.sol";
import { World } from "solecs/World.sol";
import { getAddressById } from "solecs/utils.sol";

contract Deploy is DSTest {
  Cheats internal immutable vm = Cheats(HEVM_ADDRESS);

  function debug(
    address caller,
    address world,
    string memory rawSystemId,
    bytes memory arguments,
    bool broadcast
  ) public returns (bytes memory result) {
    broadcast ? vm.startBroadcast(caller) : vm.startPrank(caller);
    IUint256Component systems = World(world).systems();
    ISystem system = ISystem(getAddressById(systems, uint256(keccak256(bytes(rawSystemId)))));
    result = system.execute(arguments);
    broadcast ? vm.stopBroadcast() : vm.stopPrank();
  }
}
