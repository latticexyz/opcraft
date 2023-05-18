// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;
import "solecs/BareComponent.sol";
uint256 constant ID = uint256(keccak256("component.VoxelTransition"));

// if a voxel sees a voxelType it's looking for, then transition to the changeTo type
contract VoxelTransitionComponent is BareComponent {
  constructor(address world) BareComponent(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](2);
    values = new LibTypes.SchemaValue[](2);

    keys[0] = "lookForType";
    values[0] = LibTypes.SchemaValue.STRING;

    keys[1] = "changeToType";
    values[1] = LibTypes.SchemaValue.STRING;
  }

  function set(
    uint256 entity,
    string memory lookForType,
    string memory changeToType
  ) public {
    set(entity, abi.encode(lookForType, changeToType));
  }

  function get(uint256 entity) public view returns (string, string) {
    (string memory lookForType, string memory changeToType) = abi.decode(getRawValue(entity), (uint8, string));
    return (lookForType, changeToType);
  }
}
