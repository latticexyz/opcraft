// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { SignalComponent, ID as SignalComponentID, SignalData } from "../components/SignalComponent.sol";
import { SignalSourceComponent, ID as SignalSourceComponentID } from "../components/SignalSourceComponent.sol";
import { PoweredComponent, ID as PoweredComponentID } from "../components/PoweredComponent.sol";
import { InvertedSignalComponent, ID as InvertedSignalComponentID } from "../components/InvertedSignalComponent.sol";
import { VoxelCoord, BlockDirection } from "../types.sol";

import { AirID, WaterID, WoolID, SandID, CyanFlowerID, OrangeFlowerID } from "../prototypes/Blocks.sol";

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
    InvertedSignalComponent invertedSignalComponent = InvertedSignalComponent(
      getAddressById(components, InvertedSignalComponentID)
    );
    PoweredComponent poweredComponent = PoweredComponent(getAddressById(components, PoweredComponentID));

    // if the type of block is a wool, add signal to it
    if (blockType == CyanFlowerID) {
      signalComponent.set(entity, SignalData({ isActive: false, direction: BlockDirection.None }));
    } else if (blockType == OrangeFlowerID) {
      invertedSignalComponent.set(entity, SignalData({ isActive: true, direction: BlockDirection.None }));
    }
    // if its a sand block, add signal source to it
    else if (blockType == SandID) {
      signalSourceComponent.set(entity, true);
    } else {
      // make all other blocks powered but off
      poweredComponent.set(entity, SignalData({ isActive: false, direction: BlockDirection.None }));
    }
  }
}
