// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";

import { ItemPrototypeComponent, ID as ItemPrototypeComponentID } from "../components/ItemPrototypeComponent.sol";
import { OccurrenceComponent, ID as OccurrenceComponentID, FunctionSelector } from "../components/OccurrenceComponent.sol";
import { OccurrenceSystem, ID as OccurrenceSystemID } from "../systems/OccurrenceSystem.sol";
import { console } from "forge-std/console.sol";

uint256 constant AirID = uint256(keccak256("block.Air"));
uint256 constant GrassID = uint256(keccak256("block.Grass"));
uint256 constant DirtID = uint256(keccak256("block.Dirt"));
uint256 constant LogID = uint256(keccak256("block.Log"));
uint256 constant StoneID = uint256(keccak256("block.Stone"));
uint256 constant SandID = uint256(keccak256("block.Sand"));
uint256 constant WaterID = uint256(keccak256("block.Water"));
uint256 constant CobblestoneID = uint256(keccak256("block.Cobblestone"));
uint256 constant CoalID = uint256(keccak256("block.Coal"));
uint256 constant CraftingID = uint256(keccak256("block.Crafting"));
uint256 constant IronID = uint256(keccak256("block.Iron"));
uint256 constant GoldID = uint256(keccak256("block.Gold"));
uint256 constant DiamondID = uint256(keccak256("block.Diamond"));
uint256 constant LeavesID = uint256(keccak256("block.Leaves"));
uint256 constant PlanksID = uint256(keccak256("block.Planks"));
uint256 constant RedFlowerID = uint256(keccak256("block.RedFlower"));
uint256 constant GrassPlantID = uint256(keccak256("block.GrassPlant"));
uint256 constant OrangeFlowerID = uint256(keccak256("block.OrangeFlower"));
uint256 constant MagentaFlowerID = uint256(keccak256("block.MagentaFlower"));
uint256 constant LightBlueFlowerID = uint256(keccak256("block.LightBlueFlower"));
uint256 constant LimeFlowerID = uint256(keccak256("block.LimeFlower"));
uint256 constant PinkFlowerID = uint256(keccak256("block.PinkFlower"));
uint256 constant GrayFlowerID = uint256(keccak256("block.GrayFlower"));
uint256 constant LightGrayFlowerID = uint256(keccak256("block.LightGrayFlower"));
uint256 constant CyanFlowerID = uint256(keccak256("block.CyanFlower"));
uint256 constant PurpleFlowerID = uint256(keccak256("block.PurpleFlower"));
uint256 constant BlueFlowerID = uint256(keccak256("block.BlueFlower"));
uint256 constant GreenFlowerID = uint256(keccak256("block.GreenFlower"));
uint256 constant BlackFlowerID = uint256(keccak256("block.BlackFlower"));
uint256 constant KelpID = uint256(keccak256("block.Kelp"));
uint256 constant WoolID = uint256(keccak256("block.Wool"));
uint256 constant SnowID = uint256(keccak256("block.Snow"));
uint256 constant ClayID = uint256(keccak256("block.Clay"));
uint256 constant BedrockID = uint256(keccak256("block.Bedrock"));

function defineBlocks(
  ItemPrototypeComponent itemPrototype,
  OccurrenceComponent occurrenceComponent,
  OccurrenceSystem occurrenceSystem
) {
  itemPrototype.set(GrassID);
  occurrenceComponent.set(GrassID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Grass.selector));

  itemPrototype.set(DirtID);
  occurrenceComponent.set(DirtID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Dirt.selector));

  itemPrototype.set(LogID);
  occurrenceComponent.set(LogID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Log.selector));

  itemPrototype.set(StoneID);
  occurrenceComponent.set(StoneID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Stone.selector));

  itemPrototype.set(SandID);
  occurrenceComponent.set(SandID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Sand.selector));

  itemPrototype.set(WaterID);
  occurrenceComponent.set(WaterID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Water.selector));

  itemPrototype.set(DiamondID);
  occurrenceComponent.set(DiamondID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Diamond.selector));

  itemPrototype.set(LeavesID);
  occurrenceComponent.set(LeavesID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Leaves.selector));

  itemPrototype.set(WoolID);
  occurrenceComponent.set(WoolID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Wool.selector));

  itemPrototype.set(SnowID);
  occurrenceComponent.set(SnowID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Snow.selector));

  itemPrototype.set(ClayID);
  occurrenceComponent.set(ClayID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Clay.selector));

  itemPrototype.set(BedrockID);
  occurrenceComponent.set(BedrockID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Bedrock.selector));

  itemPrototype.set(RedFlowerID);
  occurrenceComponent.set(
    RedFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.RedFlower.selector)
  );

  itemPrototype.set(GrassPlantID);
  occurrenceComponent.set(
    GrassPlantID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.GrassPlant.selector)
  );

  itemPrototype.set(OrangeFlowerID);
  occurrenceComponent.set(
    OrangeFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.OrangeFlower.selector)
  );

  itemPrototype.set(MagentaFlowerID);
  occurrenceComponent.set(
    MagentaFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.MagentaFlower.selector)
  );

  itemPrototype.set(LightBlueFlowerID);
  occurrenceComponent.set(
    LightBlueFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.LightBlueFlower.selector)
  );

  itemPrototype.set(LimeFlowerID);
  occurrenceComponent.set(
    LimeFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.LimeFlower.selector)
  );

  itemPrototype.set(PinkFlowerID);
  occurrenceComponent.set(
    PinkFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.PinkFlower.selector)
  );

  itemPrototype.set(GrayFlowerID);
  occurrenceComponent.set(
    GrayFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.GrayFlower.selector)
  );

  itemPrototype.set(LightGrayFlowerID);
  occurrenceComponent.set(
    LightGrayFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.LightGrayFlower.selector)
  );

  itemPrototype.set(CyanFlowerID);
  occurrenceComponent.set(
    CyanFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.CyanFlower.selector)
  );

  itemPrototype.set(PurpleFlowerID);
  occurrenceComponent.set(
    PurpleFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.PurpleFlower.selector)
  );

  itemPrototype.set(BlueFlowerID);
  occurrenceComponent.set(
    BlueFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.BlueFlower.selector)
  );

  itemPrototype.set(GreenFlowerID);
  occurrenceComponent.set(
    GreenFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.GreenFlower.selector)
  );

  itemPrototype.set(BlackFlowerID);
  occurrenceComponent.set(
    BlackFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.BlackFlower.selector)
  );

  itemPrototype.set(KelpID);
  occurrenceComponent.set(KelpID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Kelp.selector));

  itemPrototype.set(AirID);
  itemPrototype.set(CobblestoneID);
  itemPrototype.set(CoalID);
  itemPrototype.set(CraftingID);
  itemPrototype.set(IronID);
  itemPrototype.set(GoldID);
  itemPrototype.set(PlanksID);
}
