// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/BoolComponent.sol";

uint256 constant ID = uint256(keccak256("component.UpdateSet"));

contract UpdateSetComponent is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}

  function addVoxel(uint256 voxelId) public {
    set(voxelId, abi.encode(true));
  }

  function getVoxels() public returns (uint256[] memory) {
    return getEntitiesWithValue(true);
  }

  // there's no good way to clear:
  // https://github.com/OpenZeppelin/openzeppelin-contracts/issues/3256
  function clearSet() public {
    uint256[] memory ids = getEntitiesWithValue(true);
    for (uint256 id = 0; id < ids.length; id++) {
      remove(id);
    }
  }
}
