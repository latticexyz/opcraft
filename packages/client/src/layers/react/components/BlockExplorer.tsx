import React from "react";
import { isNetworkComponentUpdateEvent, NetworkComponentUpdate } from "@latticexyz/network";
import { ComponentValue, EntityID, getComponentValue, SchemaOf } from "@latticexyz/recs";
import { filter, scan, merge, map } from "rxjs";
import { BlockIdToKey, BlockTypeKey } from "../../network/constants";
import { registerUIComponent } from "../engine";
import styled from "styled-components";
import { getBlockIconUrl } from "../../noa/constants";

type BlockSummary = {
  [blockNumber: string]: Partial<Record<BlockTypeKey, { add?: number; remove?: number }>>;
};

const BlockExplorerContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-direction: row-reverse;
  padding: 8px;
  overflow: hidden;
  // background: linear-gradient(180deg, rgba(31, 31, 31, 0.6) 0%, rgba(31, 31, 31, 0) 75%);
  font-size: 0.8rem;

  .BlockExplorer-Block {
    border-left: 2px solid rgba(31, 31, 31, 0.3);
    position: relative;
    margin-bottom: 1em;
  }
  .BlockExplorer-BlockNumber {
    position: absolute;
    bottom: -1em;
    left: -2px;
    border-left: 2px solid rgba(31, 31, 31, 0.3);
    height: 1em;
    padding-left: 3px;
    padding-top: 3px;
  }
  .BlockExplorer-Actions {
    height: 20px;
    display: flex;
    padding: 0 1px;
  }
  .BlockExplorer-Action {
    position: relative;
    margin: 0 1px;
  }
  .BlockExplorer-Action img {
    height: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 2px;
  }
  .BlockExplorer-ActionIcon {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .BlockExplorer-ActionIcon--remove {
    color: hsl(0, 100%, 80%);
  }
  .BlockExplorer-ActionIcon--add {
    color: hsl(100, 100%, 80%);
  }
`;

export function registerBlockExplorer() {
  registerUIComponent(
    "BlockExplorer",
    {
      rowStart: 1,
      rowEnd: 3,
      colStart: 1,
      colEnd: 13,
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
            return summary[update] ? summary : { ...summary, [update]: {} };
          }

          // otherwise it's a NetworkComponentUpdate
          const { blockNumber, txHash } = update;
          // We're only visualizing the stream of new blocks so skip backfill
          if (txHash === "worker" || txHash === "cache") return summary;

          const componentKey = mappings[update.component];

          // Item component updates correspond to a mined terrain block
          if (componentKey === "Item") {
            console.log("mined terrain block");
            const { value } = update.value as ComponentValue<SchemaOf<typeof Item>>;
            const blockType = BlockIdToKey[value as EntityID];
            return {
              ...summary,
              [blockNumber]: {
                ...(summary[blockNumber] ?? {}),
                [blockType]: {
                  ...(summary[blockNumber]?.[blockType] ?? {}),
                  remove: (summary[blockNumber]?.[blockType]?.remove ?? 0) + 1,
                },
              },
            };
          }

          // Position component updates correspond to a mined or placed ECS block
          if (componentKey === "Position") {
            const entityIndex = world.entityToIndex.get(update.entity);
            const blockTypeId = entityIndex != null ? getComponentValue(Item, entityIndex)?.value : undefined;
            if (!blockTypeId) {
              // console.warn("Received Position update of unknown entity", update.entity);
              return summary;
            }
            const blockType = BlockIdToKey[blockTypeId as EntityID];

            // If the update includes a position, it corresponds to a placed block
            if (update.value) {
              console.log("placed block");
              return {
                ...summary,
                [blockNumber]: {
                  ...(summary[blockNumber] ?? {}),
                  [blockType]: {
                    ...(summary[blockNumber]?.[blockType] ?? {}),
                    add: (summary[blockNumber]?.[blockType]?.add ?? 0) + 1,
                  },
                },
              };
            }
            // otherwise it corresponds to a mined ecs block
            else {
              console.log("mined ecs block");
              return {
                ...summary,
                [blockNumber]: {
                  ...(summary[blockNumber] ?? {}),
                  [blockType]: {
                    ...(summary[blockNumber]?.[blockType] ?? {}),
                    remove: (summary[blockNumber]?.[blockType]?.remove ?? 0) + 1,
                  },
                },
              };
            }
          }

          return summary;
        }, {})
      );
    },
    (summary) => {
      return (
        <BlockExplorerContainer>
          {Object.entries(summary).map(([blockNumber, block]) => (
            <div key={blockNumber} className="BlockExplorer-Block">
              {parseInt(blockNumber) % 16 === 0 ? <div className="BlockExplorer-BlockNumber">{blockNumber}</div> : null}
              <div className="BlockExplorer-Actions">
                {Object.entries(block).map(([blockType, counts], i) => {
                  if (blockType === "Air") return null;
                  return (
                    <React.Fragment key={blockType}>
                      {counts.add ? (
                        <div className="BlockExplorer-Action">
                          <img src={getBlockIconUrl(blockType as BlockTypeKey)} />
                          <div className="BlockExplorer-ActionIcon BlockExplorer-ActionIcon--add">+{counts.add}</div>
                        </div>
                      ) : null}
                      {counts.remove ? (
                        <div className="BlockExplorer-Action">
                          <img src={getBlockIconUrl(blockType as BlockTypeKey)} />
                          <div className="BlockExplorer-ActionIcon BlockExplorer-ActionIcon--remove">
                            -{counts.remove}
                          </div>
                        </div>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </BlockExplorerContainer>
      );
    }
  );
}
