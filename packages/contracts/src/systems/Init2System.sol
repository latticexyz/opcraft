// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { RecipeComponent, ID as RecipeComponentID } from "../components/RecipeComponent.sol";
import { defineRecipes } from "../prototypes/Recipes.sol";

uint256 constant ID = uint256(keccak256("system.Init2"));

contract Init2System is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory) public returns (bytes memory) {
    // Get components
    RecipeComponent recipeComponent = RecipeComponent(getAddressById(components, RecipeComponentID));

    // Recipes
    defineRecipes(recipeComponent);
  }
}
