// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { BlockTypeComponent, ID as BlockTypeComponentID } from "../components/BlockTypeComponent.sol";
import { RecipeComponent, ID as RecipeComponentID } from "../components/RecipeComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { BlockType } from "../constants.sol";
import { console } from "forge-std/console.sol";

uint256 constant ID = uint256(keccak256("ember.system.craft"));

contract CraftingSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256[] memory ingredients, uint32 result) = abi.decode(arguments, (uint256[], uint32));

    uint32[] memory recipe = new uint32[](10);

    BlockTypeComponent blockTypeComponent = BlockTypeComponent(getAddressById(components, BlockTypeComponentID));

    // Construct the recipe array
    for (uint256 i; i < ingredients.length; i++) {
      recipe[i] = blockTypeComponent.getValue(ingredients[i]);
    }
    recipe[9] = result;

    // Check if this recipe exists
    RecipeComponent recipeComponent = RecipeComponent(getAddressById(components, RecipeComponentID));
    require(recipeComponent.getEntitiesWithValue(recipe).length > 0, "recipe does not exist");

    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    // Burn all input entities
    for (uint256 i; i < ingredients.length; i++) {
      ownedByComponent.remove(ingredients[i]);
    }

    // Create a new entity and give it to msg.sender
    uint256 entity = world.getUniqueEntityId();
    blockTypeComponent.set(entity, result);
    ownedByComponent.set(entity, addressToEntity(msg.sender));
  }

  function executeTyped(uint256[] memory ingredients, uint32 result) public returns (bytes memory) {
    return execute(abi.encode(ingredients, result));
  }
}
