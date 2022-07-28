// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

enum BlockType {
  Air,
  Grass,
  Dirt,
  Log,
  Sand,
  Stone,
  Water,
  Cobblestone,
  Coal,
  Crafting,
  Iron,
  Gold,
  Diamond,
  Leaves,
  Planks
}

uint256 constant GodID = 0x60D;

// Recipes
uint256 constant PlanksRecipeID = uint256(keccak256("ember.recipe.planks"));
uint256 constant CraftingRecipeID = uint256(keccak256("ember.recipe.crafting"));
