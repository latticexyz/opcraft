import { defineComponentSystem, getComponentValue } from "@latticexyz/recs";
import { keccak256 } from "@latticexyz/utils";
import { EntityID } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export async function createInvertedSignalSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    api: { setBlock },
  } = context;

  const {
    world,
    components: { Position, InvertedSignal },
    api: { getInvertedSignalData, isSignalSource },
  } = network;

  defineComponentSystem(world, InvertedSignal, (update) => {
    const position = getComponentValue(Position, update.entity);
    const blockSignalData: any = getInvertedSignalData(update.entity);

    if (position !== undefined) {
      if (blockSignalData.isActive) {
        // set block to redflower
        setBlock(position, keccak256("block.OrangeFlower") as EntityID);
      } else {
        setBlock(position, keccak256("block.LimeFlower") as EntityID);
      }
    }
  });
}
