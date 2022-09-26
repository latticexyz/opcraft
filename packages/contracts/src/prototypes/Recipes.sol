// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { RecipeComponent, ID as RecipeComponentID } from "../components/RecipeComponent.sol";
import { PlanksID, CraftingID, LogID } from "./Blocks.sol";
import { initializeArray } from "../utils.sol";

function defineRecipes(RecipeComponent recipeComponent) {
  // Planks to Crafting
  uint256[][] memory recipe = initializeArray(2, 2);
  recipe[0][0] = PlanksID;
  recipe[0][1] = PlanksID;
  recipe[1][0] = PlanksID;
  recipe[1][1] = PlanksID;
  recipeComponent.set(CraftingID, uint256(keccak256(abi.encode(recipe))));

  // Log to Planks
  recipe = initializeArray(1, 1);
  recipe[0][0] = LogID;
  recipeComponent.set(PlanksID, uint256(keccak256(abi.encode(recipe))));
}
