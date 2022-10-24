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

uint256 constant ID = uint256(keccak256("system.Stake"));

// Stake entity = concat(address | chunk.x | chunk.y)
function getStakeEntity(Coord memory chunk, address entity) pure returns (uint256) {
  return uint256((uint256(uint160(entity)) << 64) | (uint64(uint32(chunk.x)) << 32) | uint32(chunk.y));
}

function getStakeInChunk(StakeComponent stakeComponent, uint256 stakeEntity) view returns (uint32) {
  bytes memory currentStakeBytes = stakeComponent.getRawValue(stakeEntity);
  return currentStakeBytes.length == 0 ? 0 : abi.decode(currentStakeBytes, (uint32));
}

contract StakeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 blockEntity, Coord memory chunk) = abi.decode(arguments, (uint256, Coord));

    // Initialize components
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    StakeComponent stakeComponent = StakeComponent(getAddressById(components, StakeComponentID));
    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));

    // Require block to be owned by caller
    require(ownedByComponent.getValue(blockEntity) == addressToEntity(msg.sender), "block is not owned by player");

    // Require block to be Diamond
    require(itemComponent.getValue(blockEntity) == DiamondID, "can only stake diamond blocks");

    // Remove block from inventory and place it in the world
    ownedByComponent.remove(blockEntity);

    // Increase stake in this chunk
    uint256 stakeEntity = getStakeEntity(chunk, msg.sender);
    uint32 currentStake = getStakeInChunk(stakeComponent, stakeEntity);

    stakeComponent.set(stakeEntity, currentStake + 1);
  }

  function executeTyped(uint256 entity, Coord memory chunk) public returns (bytes memory) {
    return execute(abi.encode(entity, chunk));
  }
}
