// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { StakeComponent, ID as StakeComponentID } from "../components/StakeComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { Coord } from "../types.sol";
import { DiamondID } from "../prototypes/Blocks.sol";
import { getStakeEntity, getStakeInChunk } from "./StakeSystem.sol";

uint256 constant ID = uint256(keccak256("system.BulkStake"));

contract BulkStakeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256[] memory entities, Coord memory chunk) = abi.decode(arguments, (uint256[], Coord));

    // Initialize components
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));
    StakeComponent stakeComponent = StakeComponent(getAddressById(components, StakeComponentID));

    // Remove ownedBy
    uint256 blockEntity;
    for (uint256 i; i < entities.length; i++) {
      blockEntity = entities[i];

      // Require block to be owned by caller
      require(ownedByComponent.getValue(blockEntity) == addressToEntity(msg.sender), "block is not owned by player");

      // Require block to be Diamond
      require(itemComponent.getValue(blockEntity) == DiamondID, "can only stake diamond blocks");

      // Remove block from inventory and place it in the world
      ownedByComponent.remove(blockEntity);
    }

    // Increase stake in this chunk
    uint256 stakeEntity = getStakeEntity(chunk, msg.sender);
    uint32 currentStake = getStakeInChunk(stakeComponent, stakeEntity);

    stakeComponent.set(stakeEntity, uint32(currentStake + entities.length));
  }

  function executeTyped(uint256[] memory entities, Coord memory chunk) public returns (bytes memory) {
    return execute(abi.encode(entities, chunk));
  }
}
