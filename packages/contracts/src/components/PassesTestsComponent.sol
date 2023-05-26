// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/Uint256ArrayBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.PassesTests"));

// maps the testId -> creationIds[] that passed the test
contract PassesTestsComponent is Uint256ArrayBareComponent {
  constructor(address world) Uint256ArrayBareComponent(world, ID) {}

  // TODO: make sure duplicates cannot be added
  function addTest(uint256 entityId, uint256 testId) public virtual {
    bytes memory oldTestsBytes = getRawValue(entityId);
    uint256[] memory oldTests = oldTestsBytes.length == 0 ? new uint256[](0) : abi.decode(oldTestsBytes, (uint256[]));
    uint256[] memory newTests = new uint256[](oldTests.length + 1);
    for (uint256 i = 0; i < oldTests.length; i++) {
      newTests[i] = oldTests[i];
    }
    newTests[oldTests.length] = testId;
    set(entityId, abi.encode(newTests));
  }
}
