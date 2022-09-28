import React from "react";
import { isNetworkComponentUpdateEvent, NetworkComponentUpdate } from "@latticexyz/network";
import { ComponentValue, EntityID, getComponentValue, SchemaOf } from "@latticexyz/recs";
import { filter, scan, merge, map } from "rxjs";
import { BlockIdToKey, BlockTypeKey } from "../../network/constants";
import { registerUIComponent } from "../engine";

type BlockSummary = { blockNumber: number; mine: BlockTypeKey[]; build: BlockTypeKey[] }[];

const NUM_BLOCKS = 5;

function count(items: string[]) {
  return items.reduce<{ [key: string]: number }>((acc, curr) => {
    acc[curr] = acc[curr] || 0;
    acc[curr]++;
    return acc;
  }, {});
}

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
          world,
        },
      } = layers;

      // Group stream of component update events by block number
      return merge(blockNumber$, ecsEvent$.pipe(filter(isNetworkComponentUpdateEvent))).pipe(
        scan<NetworkComponentUpdate | number, BlockSummary>((summary, update) => {
          // Block number
          if (typeof update === "number") {
            const block = summary.find((e) => e.blockNumber === update);
            if (!block) summary.push({ blockNumber: update, mine: [], build: [] });
            return summary.slice(-NUM_BLOCKS);
          }

          // otherwise it's a NetworkComponentUpdate
          const { blockNumber, txHash } = update;

          // We're only visualizing the stream of new blocks so skip backfill
          if (txHash === "worker" || txHash === "cache") return summary;

          // Find the block entry for this block
          let block = summary.find((e) => e.blockNumber === blockNumber);
          if (!block) {
            block = { blockNumber, mine: [], build: [] };
            summary.push(block);
          }

          const componentKey = mappings[update.component];

          // Item component updates correspond to a mined terrain block
          if (componentKey === "Item") {
            const { value } = update.value as ComponentValue<SchemaOf<typeof Item>>;
            block.mine.push(BlockIdToKey[value as EntityID]);
            return summary.slice(-NUM_BLOCKS);
          }

          // Position component updates correspond to a mined or placed ECS block
          if (componentKey === "Position") {
            const entityIndex = world.entityToIndex.get(update.entity);
            const blockType = entityIndex != null && getComponentValue(Item, entityIndex)?.value;
            if (!blockType) {
              console.warn("Received Position update of unknown entity", update.entity);
              return summary;
            }

            // If the update includes a position, it corresponds to a placed block
            if (update.value) block.build.push(BlockIdToKey[blockType as EntityID]);
            // otherwise it corresponds to a mined ecs block
            else block.mine.push(BlockIdToKey[blockType as EntityID]);
          }

          return summary.slice(-NUM_BLOCKS);
        }, []),
        // Count blocks
        map((summary) => {
          return summary.map(({ blockNumber, mine, build }) => ({
            blockNumber,
            mine: count(mine.filter((e) => e !== "Air")),
            build: count(build.filter((e) => e != "Air")),
          }));
        })
      );
    },
    (state) => {
      return (
        <div>
          <p>Event</p>
          <>{JSON.stringify(state, undefined, "\n")}</>
        </div>
      );
    }
  );
}
