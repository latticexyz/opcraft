// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { SignalComponent, ID as SignalComponentID, SignalData } from "../components/SignalComponent.sol";
import { SignalSourceComponent, ID as SignalSourceComponentID } from "../components/SignalSourceComponent.sol";
import { VoxelCoord, BlockDirection } from "../types.sol";

import { AirID, WaterID, WoolID, SandID, BlueFlowerID } from "../prototypes/Blocks.sol";

library CreateBlock {
  function addCustomComponents(
    IUint256Component components,
    uint256 blockType,
    uint256 entity
  ) public {
    SignalComponent signalComponent = SignalComponent(getAddressById(components, SignalComponentID));
    SignalSourceComponent signalSourceComponent = SignalSourceComponent(
      getAddressById(components, SignalSourceComponentID)
    );

    // if the type of block is a wool, add signal to it
    if (blockType == BlueFlowerID) {
      signalComponent.set(entity, SignalData({ isActive: false, direction: BlockDirection.None }));
    }
    // if its a sand block, add signal source to it
    if (blockType == SandID) {
      signalSourceComponent.set(entity);
    }
  }
}
