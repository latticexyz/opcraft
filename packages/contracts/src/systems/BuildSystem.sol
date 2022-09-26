// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { VoxelCoord } from "../types.sol";

uint256 constant ID = uint256(keccak256("system.Build"));

contract BuildSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // TODO: prevent building in protected chunks
  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 blockEntity, VoxelCoord memory targetPosition) = abi.decode(arguments, (uint256, VoxelCoord));

    // Initialize components
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));

    // Require block to be owned by caller
    require(ownedByComponent.getValue(blockEntity) == addressToEntity(msg.sender), "block is not owned by player");

    // Remove block from inventory and place it in the world
    ownedByComponent.remove(blockEntity);
    positionComponent.set(blockEntity, targetPosition);
  }

  function executeTyped(uint256 entity, VoxelCoord memory targetPosition) public returns (bytes memory) {
    return execute(abi.encode(entity, targetPosition));
  }
}
