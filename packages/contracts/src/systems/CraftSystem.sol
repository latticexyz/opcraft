// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { RecipeComponent, ID as RecipeComponentID } from "../components/RecipeComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { initializeArray } from "../utils.sol";

uint256 constant ID = uint256(keccak256("system.Craft"));

contract CraftSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256[][] memory ingredients = abi.decode(arguments, (uint256[][]));

    RecipeComponent recipeComponent = RecipeComponent(getAddressById(components, RecipeComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    ItemComponent itemComponent = ItemComponent(getAddressById(components, ItemComponentID));

    uint256[][] memory ingredientTypes = initializeArray(ingredients.length, ingredients[0].length);
    // Require all ingredients to be owned by the sender
    for (uint256 i; i < ingredients.length; i++) {
      for (uint256 j; j < ingredients[i].length; j++) {
        if (ingredients[i][j] == 0) continue;
        require(ownedByComponent.getValue(ingredients[i][j]) == addressToEntity(msg.sender));
        ingredientTypes[i][j] = itemComponent.getValue(ingredients[i][j]);
      }
    }

    // Require receipe to exist
    uint256[] memory recipeEntities = recipeComponent.getEntitiesWithValue(
      uint256(keccak256(abi.encode(ingredientTypes)))
    );
    require(recipeEntities.length > 0, "no recipe with these ingredients");

    // Burn all ingredients
    for (uint256 i; i < ingredients.length; i++) {
      for (uint256 j; j < ingredients[i].length; j++) {
        if (ingredients[i][j] == 0) continue;
        ownedByComponent.remove(ingredients[i][j]);
      }
    }

    // Create the output entity
    uint256 entity = world.getUniqueEntityId();
    itemComponent.set(entity, recipeEntities[0]);
    ownedByComponent.set(entity, addressToEntity(msg.sender));

    return abi.encode(entity);
  }

  function executeTyped(uint256[][] memory ingredients) public returns (uint256) {
    return abi.decode(execute(abi.encode(ingredients)), (uint256));
  }
}
