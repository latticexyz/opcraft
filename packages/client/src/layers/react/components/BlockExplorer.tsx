import { NetworkComponentUpdate } from "@latticexyz/network";
import React from "react";
import { scan } from "rxjs";
import { BlockIdToKey } from "../../network/constants";
import { registerUIComponent } from "../engine";

export function registerBlockExplorer() {
  registerUIComponent(
    "BlockExplorer",
    {
      rowStart: 1,
      rowEnd: 3,
      colStart: 1,
      colEnd: 8,
    },
    (layers) => {
      const {
        network: {
          ecsEvent$,
          mappings,
          components: { Item },
        },
        noa: { world },
      } = layers;

      // Group stream of component update events by block number
      return ecsEvent$.pipe(
        scan<NetworkComponentUpdate, Record<string, Record<string, NetworkComponentUpdate[]>>>((acc, curr) => {
          const { blockNumber, txHash } = curr;
          // const entityIndex = world.entityToIndex.get(curr.entity);
          // const componentKey = mappings[curr.component];
          // const update = curr as NetworkComponentUpdate<Item>;
          // // console.log({ componentKey }, curr);
          // if (componentKey === "Item") {
          //   const blockType = BlockIdToKey[curr.value.value];
          //   // console.log({ entityIndex, componentKey, blockType }, curr);
          // }
          acc[blockNumber] = acc[blockNumber] || {};
          acc[blockNumber][txHash] = acc[blockNumber][txHash] || [];
          acc[blockNumber][txHash].push(curr);
          console.log(acc);
          return acc;
        }, {})
      );
    },
    (state) => {
      console.log("BlockExplorer state", state);
      return (
        <div>
          <p>Event</p>
          <>{JSON.stringify(state, undefined, "\n")}</>
        </div>
      );
    }
  );
}
