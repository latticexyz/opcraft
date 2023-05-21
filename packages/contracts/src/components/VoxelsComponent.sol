// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/Uint256ArrayBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Voxels"));

// maps the creationId -> voxels in that creation
contract VoxelsComponent is Uint256ArrayBareComponent {
  constructor(address world) Uint256ArrayBareComponent(world, ID) {}

  function addVoxel(uint256 entityId, uint256 voxelId) public virtual {
    bytes memory oldVoxelsBytes = getRawValue(entityId);
    uint256[] memory oldVoxels = oldVoxelsBytes.length == 0
      ? new uint256[](0)
      : abi.decode(oldVoxelsBytes, (uint256[]));
    uint256[] memory newVoxels = new uint256[](oldVoxels.length + 1);
    for (uint256 i = 0; i < oldVoxels.length; i++) {
      newVoxels[i] = oldVoxels[i];
    }
    newVoxels[oldVoxels.length] = voxelId;
    set(entityId, abi.encode(newVoxels));
  }
}
