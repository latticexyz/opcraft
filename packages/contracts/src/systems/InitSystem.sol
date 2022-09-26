// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById } from "solecs/utils.sol";

import { GameConfigComponent, ID as GameConfigComponentID, GameConfig } from "../components/GameConfigComponent.sol";
import { RecipeComponent, ID as RecipeComponentID } from "../components/RecipeComponent.sol";
import { ItemPrototypeComponent, ID as ItemPrototypeComponentID } from "../components/ItemPrototypeComponent.sol";
import { OccurrenceComponent, ID as OccurrenceComponentID } from "../components/OccurrenceComponent.sol";
import { OccurrenceSystem, ID as OccurrenceSystemID } from "../systems/OccurrenceSystem.sol";
import { GodID, CraftingRecipeID, PlanksRecipeID } from "../constants.sol";
import { defineBlocks } from "../prototypes/Blocks.sol";

uint256 constant ID = uint256(keccak256("system.Init"));

contract InitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory) public returns (bytes memory) {
    // Get components
    GameConfigComponent gameConfigComponent = GameConfigComponent(getAddressById(components, GameConfigComponentID));
    OccurrenceComponent occurrenceComponent = OccurrenceComponent(getAddressById(components, OccurrenceComponentID));
    ItemPrototypeComponent itemPrototypeComponent = ItemPrototypeComponent(
      getAddressById(components, ItemPrototypeComponentID)
    );

    // Get systems
    OccurrenceSystem occurrenceSystem = OccurrenceSystem(getAddressById(world.systems(), OccurrenceSystemID));

    // Game config
    gameConfigComponent.set(GodID, GameConfig({ creativeMode: true }));

    // Blocks
    defineBlocks(itemPrototypeComponent, occurrenceComponent, occurrenceSystem);

    // Add recipes
    RecipeComponent recipeComponent = RecipeComponent(getAddressById(components, RecipeComponentID));

    // Plank to crafting
    // uint32[] memory recipe = new uint32[](10);
    // recipe[0] = uint32(BlockType.Planks);
    // recipe[1] = uint32(BlockType.Planks);
    // recipe[3] = uint32(BlockType.Planks);
    // recipe[4] = uint32(BlockType.Planks);
    // recipe[9] = uint32(BlockType.Crafting);
    // recipeComponent.set(CraftingRecipeID, recipe);

    // // Log to plank
    // recipe = new uint32[](10);
    // recipe[0] = uint32(BlockType.Log);
    // recipe[9] = uint32(BlockType.Planks);
    // recipeComponent.set(PlanksRecipeID, recipe);
  }
}
