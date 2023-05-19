// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { TransitionRule } from "../types.sol";
import { TypeComponent, ID as TypeComponentID } from "../components/TypeComponent.sol";
import { ColorComponent, ID as ColorComponentID } from "../components/ColorComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { VoxelRulesComponent, ID as VoxelRulesComponentID } from "../components/VoxelRulesComponent.sol";
import { TransitionRuleComponent, ID as TransitionRuleComponentID } from "../components/TransitionRuleComponent.sol";

uint256 constant ID = uint256(keccak256("system.RegisterVoxel"));

contract RegisterVoxelSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (string memory voxelType, TransitionRule[] memory rules, string memory hexColor) = abi.decode(
      arguments,
      (string, TransitionRule[], string)
    );

    require(bytes(voxelType).length > 0, "You must specify a voxel type!");
    require(
      bytes(hexColor).length > 0 && bytes(hexColor)[0] == bytes1("#"),
      "hexColor must be a hex color: e.g. #0F3232"
    );

    // we should allow voxels that have no rules, since some voxels should be just visual
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    TypeComponent typeComponent = TypeComponent(getAddressById(components, TypeComponentID));
    ColorComponent colorComponent = ColorComponent(getAddressById(components, ColorComponentID));
    VoxelRulesComponent voxelRulesComponent = VoxelRulesComponent(getAddressById(components, VoxelRulesComponentID));
    TransitionRuleComponent transitionRuleComponent = TransitionRuleComponent(
      getAddressById(components, TransitionRuleComponentID)
    );

    require(
      typeComponent.getEntitiesWithValue(voxelType).length == 0,
      "A voxel with this type already exists! Please choose another type."
    );

    uint256 voxelId = world.getUniqueEntityId();

    registerRules(voxelRulesComponent, transitionRuleComponent, voxelId, rules);
    ownedByComponent.set(voxelId, addressToEntity(msg.sender));
    typeComponent.set(voxelId, voxelType);
    colorComponent.set(voxelId, hexColor);

    return abi.encode(voxelId);
  }

  function executeTyped(
    string memory voxelType,
    TransitionRule[] memory rules,
    string memory hexColor
  ) public returns (uint256 voxelId) {
    return abi.decode(execute(abi.encode(voxelType, rules, hexColor)), (uint256));
  }

  function registerRules(
    VoxelRulesComponent voxelRulesComponent,
    TransitionRuleComponent transitionRuleComponent,
    uint256 voxelId,
    TransitionRule[] memory rules
  ) private {
    uint256 ruleId;
    uint256[] memory ruleIds = new uint256[](rules.length);
    for (uint32 i = 0; i < rules.length; i++) {
      ruleId = world.getUniqueEntityId();
      ruleIds[i] = ruleId;
      transitionRuleComponent.set(ruleId, rules[i].lookForType, rules[i].changeToType);
    }

    voxelRulesComponent.set(voxelId, ruleIds);
  }
}
