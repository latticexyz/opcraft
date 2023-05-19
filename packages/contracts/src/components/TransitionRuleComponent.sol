// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";
import { TransitionRule } from "../types.sol";
uint256 constant ID = uint256(keccak256("component.TransitionRule"));

// if a voxel sees a voxelType it's looking for, then transition to the changeTo type
contract TransitionRuleComponent is BareComponent {
  constructor(address world) BareComponent(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](2);
    values = new LibTypes.SchemaValue[](2);

    keys[0] = "lookForType";
    values[0] = LibTypes.SchemaValue.UINT256;

    keys[1] = "changeToType";
    values[1] = LibTypes.SchemaValue.UINT256;
  }

  function set(uint256 entity, TransitionRule memory transitionRule) public {
    set(entity, abi.encode(transitionRule.lookForType, transitionRule.changeToType));
  }

  function get(uint256 entity) public view returns (TransitionRule memory) {
    (uint256 lookForType, uint256 changeToType) = abi.decode(getRawValue(entity), (uint256, uint256));
    return TransitionRule(lookForType, changeToType);
  }
}
