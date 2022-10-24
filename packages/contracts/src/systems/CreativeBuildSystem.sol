// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../components/ItemComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID, GameConfig } from "../components/GameConfigComponent.sol";
import { getClaimAtCoord } from "../systems/ClaimSystem.sol";
import { VoxelCoord } from "../types.sol";
import { AirID } from "../prototypes/Blocks.sol";
import { GodID } from "../constants.sol";

uint256 constant ID = uint256(keccak256("system.CreativeBuild"));

contract CreativeBuildSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 blockEntity, VoxelCoord memory coord) = abi.decode(arguments, (uint256, VoxelCoord));

    // Initialize components
    GameConfigComponent gameConfigComponent = GameConfigComponent(getAddressById(components, GameConfigComponentID));
    GameConfig memory gameConfig = gameConfigComponent.getValue(GodID);
    require(gameConfig.creativeMode, "CREATIVE MODE DISABLED");

    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));

    // Get block type of block
    uint256 blockType = itemComponent.getValue(blockEntity);

    // Create a new ECS block with the same item type
    uint256 entity = world.getUniqueEntityId();
    itemComponent.set(entity, blockType);
    positionComponent.set(entity, coord);
  }

  function executeTyped(uint256 entity, VoxelCoord memory coord) public returns (bytes memory) {
    return execute(abi.encode(entity, coord));
  }
}
