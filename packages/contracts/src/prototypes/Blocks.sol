// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";

import { ItemPrototypeComponent, ID as ItemPrototypeComponentID } from "../components/ItemPrototypeComponent.sol";

uint256 constant AirID = uint256(keccak256("block.Air"));
uint256 constant GrassID = uint256(keccak256("block.Grass"));
uint256 constant DirtID = uint256(keccak256("block.Dirt"));
uint256 constant LogID = uint256(keccak256("block.Log"));
uint256 constant SandID = uint256(keccak256("block.Sand"));
uint256 constant StoneID = uint256(keccak256("block.Stone"));
uint256 constant WaterID = uint256(keccak256("block.Water"));
uint256 constant CobblestoneID = uint256(keccak256("block.Cobblestone"));
uint256 constant CoalID = uint256(keccak256("block.Coal"));
uint256 constant CraftingID = uint256(keccak256("block.Crafting"));
uint256 constant IronID = uint256(keccak256("block.Iron"));
uint256 constant GoldID = uint256(keccak256("block.Gold"));
uint256 constant DiamondID = uint256(keccak256("block.Diamond"));
uint256 constant LeavesID = uint256(keccak256("block.Leaves"));
uint256 constant PlanksID = uint256(keccak256("block.Planks"));

function defineBlocks(ItemPrototypeComponent itemPrototype) {
  itemPrototype.set(AirID);
  itemPrototype.set(GrassID);
  itemPrototype.set(DirtID);
  itemPrototype.set(LogID);
  itemPrototype.set(SandID);
  itemPrototype.set(StoneID);
  itemPrototype.set(WaterID);
  itemPrototype.set(CobblestoneID);
  itemPrototype.set(CoalID);
  itemPrototype.set(CraftingID);
  itemPrototype.set(IronID);
  itemPrototype.set(GoldID);
  itemPrototype.set(DiamondID);
  itemPrototype.set(LeavesID);
  itemPrototype.set(PlanksID);
}
