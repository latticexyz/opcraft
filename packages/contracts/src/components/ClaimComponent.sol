// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Claim"));

struct Claim {
  uint32 stake;
  uint256 claimer;
}

contract ClaimComponent is BareComponent {
  constructor(address world) BareComponent(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](2);
    values = new LibTypes.SchemaValue[](2);

    keys[0] = "stake";
    values[0] = LibTypes.SchemaValue.UINT32;

    keys[1] = "claimer";
    values[1] = LibTypes.SchemaValue.UINT256;
  }

  function set(uint256 entity, Claim memory claim) public {
    set(entity, abi.encode(claim));
  }

  function getValue(uint256 entity) public view returns (Claim memory) {
    return abi.decode(getRawValue(entity), (Claim));
  }
}
