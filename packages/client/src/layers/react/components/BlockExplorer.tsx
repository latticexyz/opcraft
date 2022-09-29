import React from "react";
import { isNetworkComponentUpdateEvent, NetworkComponentUpdate } from "@latticexyz/network";
import { ComponentValue, EntityID, getComponentValue, SchemaOf } from "@latticexyz/recs";
import { filter, scan, merge, map } from "rxjs";
import { BlockIdToKey, BlockTypeKey } from "../../network/constants";
import { registerUIComponent } from "../engine";
import styled from "styled-components";
import { getBlockIconUrl } from "../../noa/constants";

type BlockSummary = {
  [blockNumber: string]: {
    startBlock: number;
    endBlock: number;
    entities: { [blockType in BlockTypeKey]?: number };
  };
};

const BlockExplorerContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 32px 12px;

  .BlockExplorer-Block {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, 30px);
    grid-template-rows: repeat(3, 30px);
    gap: 4px;
    padding: 4px;
    background: rgba(31, 31, 31, 0.4);
  }
  .BlockExplorer-BlockNumber {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    text-align: center;
    color: #000;
    text-shadow: none;
    background: rgba(255, 255, 255, 0.8);
    padding: 4px;
  }
  .BlockExplorer-Entity {
    position: relative;
  }
  .BlockExplorer-Entity img {
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    box-shadow: 1.5px 1.5px 0 0 #000;
    background-color: rgba(31, 31, 31, 0.6);
  }
  .BlockExplorer-EntityCount {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const blockNumberToBucket = (blockNumber: number) => {
  return Math.floor(blockNumber / 64) * 64;
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
          world,
        },
      } = layers;

      // Group stream of component update events by block number
      return merge(blockNumber$, ecsEvent$.pipe(filter(isNetworkComponentUpdateEvent)))
        .pipe(
          scan<NetworkComponentUpdate | number, BlockSummary>((summary, update) => {
            // Block number
            if (typeof update === "number") {
              const bucketNumber = blockNumberToBucket(update);
              return {
                ...summary,
                [bucketNumber]: {
                  ...(summary[bucketNumber] || {
                    startBlock: update,
                    endBlock: update,
                    entities: {},
                  }),
                  endBlock: update,
                },
              };
            }

            // otherwise it's a NetworkComponentUpdate
            const { blockNumber, txHash } = update;
            const bucketNumber = blockNumberToBucket(blockNumber);
            // We're only visualizing the stream of new blocks so skip backfill
            if (txHash === "worker" || txHash === "cache") return summary;

            const block = {
              ...(summary[bucketNumber] || {
                startBlock: blockNumber,
                endBlock: blockNumber,
                entities: {},
              }),
            };
            block.endBlock = blockNumber;
            const componentKey = mappings[update.component];

            // Item component updates correspond to a mined terrain block
            if (componentKey === "Item") {
              console.log("mined terrain block");
              const { value } = update.value as ComponentValue<SchemaOf<typeof Item>>;
              block.entities[BlockIdToKey[value as EntityID]] =
                (block.entities[BlockIdToKey[value as EntityID]] || 0) + 1;
              return {
                ...summary,
                [bucketNumber]: block,
              };
            }

            // Position component updates correspond to a mined or placed ECS block
            if (componentKey === "Position") {
              const entityIndex = world.entityToIndex.get(update.entity);
              const blockType = entityIndex != null ? getComponentValue(Item, entityIndex)?.value : undefined;
              if (!blockType) {
                // console.warn("Received Position update of unknown entity", update.entity);
                return summary;
              }

              // If the update includes a position, it corresponds to a placed block
              if (update.value) {
                console.log("placed block");
                block.entities[BlockIdToKey[blockType as EntityID]] =
                  (block.entities[BlockIdToKey[blockType as EntityID]] || 0) + 1;
                return {
                  ...summary,
                  [bucketNumber]: block,
                };
              }
              // otherwise it corresponds to a mined ecs block
              else {
                console.log("mined ecs block");
                block.entities[BlockIdToKey[blockType as EntityID]] =
                  (block.entities[BlockIdToKey[blockType as EntityID]] || 0) + 1;
                return {
                  ...summary,
                  [bucketNumber]: block,
                };
              }
            }

            return summary;
          }, {})
        )
        .pipe(map((summary) => Object.fromEntries(Object.entries(summary).slice(-5))));
    },
    (summary) => {
      console.log("summary", summary);
      return (
        <BlockExplorerContainer>
          {Object.entries(summary).map(([blockNumber, block]) => {
            const diff = block.endBlock - block.startBlock;
            return (
              <div key={blockNumber} className="BlockExplorer-Block">
                <div className="BlockExplorer-BlockNumber">
                  #{block.startBlock}+{diff}
                </div>
                {block.entities
                  ? Object.entries(block.entities).map(([blockType, count]) => {
                      if (blockType === "Air") return null;
                      return (
                        <div key={blockType} className="BlockExplorer-Entity">
                          <img src={getBlockIconUrl(blockType as BlockTypeKey)} />
                          <div className="BlockExplorer-EntityCount">{count}</div>
                        </div>
                      );
                    })
                  : null}
              </div>
            );
          })}
        </BlockExplorerContainer>
      );
    }
  );
}
