// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";

import { ItemPrototypeComponent, ID as ItemPrototypeComponentID } from "../components/ItemPrototypeComponent.sol";
import { OccurrenceComponent, ID as OccurrenceComponentID, FunctionSelector } from "../components/OccurrenceComponent.sol";
import { OccurrenceSystem, ID as OccurrenceSystemID } from "../systems/OccurrenceSystem.sol";

uint256 constant AirID = uint256(keccak256("block.Air"));
uint256 constant GrassID = uint256(keccak256("block.Grass"));
uint256 constant DirtID = uint256(keccak256("block.Dirt"));
uint256 constant LogID = uint256(keccak256("block.Log"));
uint256 constant StoneID = uint256(keccak256("block.Stone"));
uint256 constant SandID = uint256(keccak256("block.Sand"));
uint256 constant GlassID = uint256(keccak256("block.Glass"));
uint256 constant WaterID = uint256(keccak256("block.Water"));
uint256 constant CobblestoneID = uint256(keccak256("block.Cobblestone"));
uint256 constant MossyCobblestoneID = uint256(keccak256("block.MossyCobblestone"));
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
uint256 constant OrangeWoolID = uint256(keccak256("block.OrangeWool"));
uint256 constant MagentaWoolID = uint256(keccak256("block.MagentaWool"));
uint256 constant LightBlueWoolID = uint256(keccak256("block.LightBlueWool"));
uint256 constant YellowWoolID = uint256(keccak256("block.YellowWool"));
uint256 constant LimeWoolID = uint256(keccak256("block.LimeWool"));
uint256 constant PinkWoolID = uint256(keccak256("block.PinkWool"));
uint256 constant GrayWoolID = uint256(keccak256("block.GrayWool"));
uint256 constant LightGrayWoolID = uint256(keccak256("block.LightGrayWool"));
uint256 constant CyanWoolID = uint256(keccak256("block.CyanWool"));
uint256 constant PurpleWoolID = uint256(keccak256("block.PurpleWool"));
uint256 constant BlueWoolID = uint256(keccak256("block.BlueWool"));
uint256 constant BrownWoolID = uint256(keccak256("block.BrownWool"));
uint256 constant GreenWoolID = uint256(keccak256("block.GreenWool"));
uint256 constant RedWoolID = uint256(keccak256("block.RedWool"));
uint256 constant BlackWoolID = uint256(keccak256("block.BlackWool"));
uint256 constant SpongeID = uint256(keccak256("block.Sponge"));
uint256 constant SnowID = uint256(keccak256("block.Snow"));
uint256 constant ClayID = uint256(keccak256("block.Clay"));
uint256 constant BedrockID = uint256(keccak256("block.Bedrock"));
uint256 constant BricksID = uint256(keccak256("block.Bricks"));

function defineBlocks(
  ItemPrototypeComponent itemPrototypeComponent,
  OccurrenceComponent occurrenceComponent,
  OccurrenceSystem occurrenceSystem
) {
  itemPrototypeComponent.set(GrassID);
  occurrenceComponent.set(GrassID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Grass.selector));

  itemPrototypeComponent.set(DirtID);
  occurrenceComponent.set(DirtID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Dirt.selector));

  itemPrototypeComponent.set(LogID);
  occurrenceComponent.set(LogID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Log.selector));

  itemPrototypeComponent.set(StoneID);
  occurrenceComponent.set(StoneID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Stone.selector));

  itemPrototypeComponent.set(SandID);
  occurrenceComponent.set(SandID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Sand.selector));

  itemPrototypeComponent.set(WaterID);
  occurrenceComponent.set(WaterID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Water.selector));

  itemPrototypeComponent.set(DiamondID);
  occurrenceComponent.set(DiamondID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Diamond.selector));

  itemPrototypeComponent.set(CoalID);
  occurrenceComponent.set(CoalID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Coal.selector));

  itemPrototypeComponent.set(LeavesID);
  occurrenceComponent.set(LeavesID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Leaves.selector));

  itemPrototypeComponent.set(WoolID);
  occurrenceComponent.set(WoolID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Wool.selector));

  itemPrototypeComponent.set(SnowID);
  occurrenceComponent.set(SnowID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Snow.selector));

  itemPrototypeComponent.set(ClayID);
  occurrenceComponent.set(ClayID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Clay.selector));

  itemPrototypeComponent.set(BedrockID);
  occurrenceComponent.set(BedrockID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Bedrock.selector));

  itemPrototypeComponent.set(RedFlowerID);
  occurrenceComponent.set(
    RedFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.RedFlower.selector)
  );

  itemPrototypeComponent.set(GrassPlantID);
  occurrenceComponent.set(
    GrassPlantID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.GrassPlant.selector)
  );

  itemPrototypeComponent.set(OrangeFlowerID);
  occurrenceComponent.set(
    OrangeFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.OrangeFlower.selector)
  );

  itemPrototypeComponent.set(MagentaFlowerID);
  occurrenceComponent.set(
    MagentaFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.MagentaFlower.selector)
  );

  itemPrototypeComponent.set(LightBlueFlowerID);
  occurrenceComponent.set(
    LightBlueFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.LightBlueFlower.selector)
  );

  itemPrototypeComponent.set(LimeFlowerID);
  occurrenceComponent.set(
    LimeFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.LimeFlower.selector)
  );

  itemPrototypeComponent.set(PinkFlowerID);
  occurrenceComponent.set(
    PinkFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.PinkFlower.selector)
  );

  itemPrototypeComponent.set(GrayFlowerID);
  occurrenceComponent.set(
    GrayFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.GrayFlower.selector)
  );

  itemPrototypeComponent.set(LightGrayFlowerID);
  occurrenceComponent.set(
    LightGrayFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.LightGrayFlower.selector)
  );

  itemPrototypeComponent.set(CyanFlowerID);
  occurrenceComponent.set(
    CyanFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.CyanFlower.selector)
  );

  itemPrototypeComponent.set(PurpleFlowerID);
  occurrenceComponent.set(
    PurpleFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.PurpleFlower.selector)
  );

  itemPrototypeComponent.set(BlueFlowerID);
  occurrenceComponent.set(
    BlueFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.BlueFlower.selector)
  );

  itemPrototypeComponent.set(GreenFlowerID);
  occurrenceComponent.set(
    GreenFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.GreenFlower.selector)
  );

  itemPrototypeComponent.set(BlackFlowerID);
  occurrenceComponent.set(
    BlackFlowerID,
    FunctionSelector(address(occurrenceSystem), occurrenceSystem.BlackFlower.selector)
  );

  itemPrototypeComponent.set(KelpID);
  occurrenceComponent.set(KelpID, FunctionSelector(address(occurrenceSystem), occurrenceSystem.Kelp.selector));

  itemPrototypeComponent.set(AirID);
  itemPrototypeComponent.set(GlassID);
  itemPrototypeComponent.set(SpongeID);
  itemPrototypeComponent.set(CobblestoneID);
  itemPrototypeComponent.set(CoalID);
  itemPrototypeComponent.set(CraftingID);
  itemPrototypeComponent.set(IronID);
  itemPrototypeComponent.set(GoldID);
  itemPrototypeComponent.set(PlanksID);
  itemPrototypeComponent.set(OrangeWoolID);
  itemPrototypeComponent.set(MagentaWoolID);
  itemPrototypeComponent.set(LightBlueWoolID);
  itemPrototypeComponent.set(YellowWoolID);
  itemPrototypeComponent.set(LimeWoolID);
  itemPrototypeComponent.set(PinkWoolID);
  itemPrototypeComponent.set(GrayWoolID);
  itemPrototypeComponent.set(LightGrayWoolID);
  itemPrototypeComponent.set(CyanWoolID);
  itemPrototypeComponent.set(PurpleWoolID);
  itemPrototypeComponent.set(BlueWoolID);
  itemPrototypeComponent.set(BrownWoolID);
  itemPrototypeComponent.set(GreenWoolID);
  itemPrototypeComponent.set(RedWoolID);
  itemPrototypeComponent.set(BlackWoolID);
}
