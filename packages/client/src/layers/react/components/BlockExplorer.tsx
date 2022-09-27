import { isNetworkComponentUpdateEvent, NetworkComponentUpdate } from "@latticexyz/network";
import { ComponentValue, isComponentUpdate } from "@latticexyz/recs";
import React from "react";
import { filter, scan, merge } from "rxjs";
import { BlockIdToKey } from "../../network/constants";
import { registerUIComponent } from "../engine";

type BlockSummary = {
  [blockNumber: string]: {
    [blockType: string]: number;
  };
};

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
          network: { blockNumber$ },
        },
        noa: { world },
      } = layers;

      console.log("Item.id", Item.id);

      // Group stream of component update events by block number
      return merge(blockNumber$, ecsEvent$.pipe(filter(isNetworkComponentUpdateEvent))).pipe(
        scan<NetworkComponentUpdate | number, BlockSummary>((summary, update) => {
          // Block number
          if (typeof update === "number") {
            summary[update] = summary[update] || {};
            return summary;
          }

          // otherwise it's a NetworkComponentUpdate
          const { blockNumber, txHash } = update;
          // We're only visualizing the stream of new blocks so skip backfill
          if (txHash === "worker" || txHash === "cache") return summary;

          const componentKey = mappings[update.component];
          if (componentKey === Item.id) {
            const value = update.value as ComponentValue<Item>;
            const blockType = BlockIdToKey[update.value.value];
          }

          console.log("network update", update);

          // const entityIndex = world.entityToIndex.get(curr.entity);
          // const componentKey = mappings[curr.component];
          // const update = curr as NetworkComponentUpdate<Item>;
          // // console.log({ componentKey }, curr);
          // if (componentKey === "Item") {
          //   const blockType = BlockIdToKey[curr.value.value];
          //   // console.log({ entityIndex, componentKey, blockType }, curr);
          // }

          // acc[blockNumber] = acc[blockNumber] || {};
          // acc[blockNumber].transactions[txHash] = acc[blockNumber].transactions[txHash] || [];
          // acc[blockNumber].transactions[txHash].push(curr);

          // console.log("updates for tx", txHash, acc[blockNumber].transactions[txHash]);
          return summary;
        }, {})
      );
    },
    (state) => {
      // console.log("BlockExplorer state", state);
      return (
        <div>
          <p>Event</p>
          <>{JSON.stringify(state, undefined, "\n")}</>
        </div>
      );
    }
  );
}
