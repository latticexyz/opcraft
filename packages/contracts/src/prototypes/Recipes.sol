// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { RecipeComponent, ID as RecipeComponentID } from "../components/RecipeComponent.sol";
import { PlanksID, StoneID, SandID, ClayID, GlassID, CoalID, GrassPlantID, BricksID, CobblestoneID, MossyCobblestoneID, DirtID, CraftingID, LogID, RedFlowerID, GrassPlantID, OrangeFlowerID, MagentaFlowerID, LightBlueFlowerID, LimeFlowerID, PinkFlowerID, GrayFlowerID, LightGrayFlowerID, CyanFlowerID, PurpleFlowerID, BlueFlowerID, GreenFlowerID, BlackFlowerID, KelpID, WoolID, OrangeWoolID, MagentaWoolID, LightBlueWoolID, YellowWoolID, LimeWoolID, PinkWoolID, GrayWoolID, LightGrayWoolID, CyanWoolID, PurpleWoolID, BlueWoolID, BrownWoolID, GreenWoolID, RedWoolID, BlackWoolID } from "./Blocks.sol";
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

  // Wool
  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = OrangeFlowerID;
  recipeComponent.set(OrangeWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = MagentaFlowerID;
  recipeComponent.set(MagentaWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = LightBlueFlowerID;
  recipeComponent.set(LightBlueWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(3, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = RedFlowerID;
  recipe[2][0] = KelpID;
  recipeComponent.set(YellowWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = LimeFlowerID;
  recipeComponent.set(LimeWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = PinkFlowerID;
  recipeComponent.set(PinkWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = GrayFlowerID;
  recipeComponent.set(GrayWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = LightGrayFlowerID;
  recipeComponent.set(LightGrayWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = CyanFlowerID;
  recipeComponent.set(CyanWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = PurpleFlowerID;
  recipeComponent.set(PurpleWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = BlueFlowerID;
  recipeComponent.set(BlueWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = DirtID;
  recipeComponent.set(BrownWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = GreenFlowerID;
  recipeComponent.set(GreenWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = RedFlowerID;
  recipeComponent.set(RedWoolID, uint256(keccak256(abi.encode(recipe))));

  recipe = initializeArray(2, 1);
  recipe[0][0] = WoolID;
  recipe[1][0] = BlackFlowerID;
  recipeComponent.set(BlackWoolID, uint256(keccak256(abi.encode(recipe))));

  // Cobblestone
  recipe = initializeArray(1, 1);
  recipe[0][0] = StoneID;
  recipeComponent.set(CobblestoneID, uint256(keccak256(abi.encode(recipe))));

  // Mossy Cobblestone
  recipe = initializeArray(2, 1);
  recipe[0][0] = GrassPlantID;
  recipe[1][0] = CobblestoneID;
  recipeComponent.set(MossyCobblestoneID, uint256(keccak256(abi.encode(recipe))));

  // Bricks
  recipe = initializeArray(3, 3);
  recipe[0][0] = ClayID;
  recipe[0][1] = ClayID;
  recipe[0][2] = ClayID;
  recipe[1][0] = ClayID;
  recipe[1][1] = CoalID;
  recipe[1][2] = ClayID;
  recipe[2][0] = ClayID;
  recipe[2][1] = ClayID;
  recipe[2][2] = ClayID;
  recipeComponent.set(BricksID, uint256(keccak256(abi.encode(recipe))));

  // Glass
  recipe = initializeArray(2, 1);
  recipe[0][0] = SandID;
  recipe[1][0] = CoalID;
  recipeComponent.set(GlassID, uint256(keccak256(abi.encode(recipe))));
}
