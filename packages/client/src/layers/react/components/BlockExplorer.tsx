import React from "react";
import { isNetworkComponentUpdateEvent, NetworkComponentUpdate } from "@latticexyz/network";
import { ComponentValue, EntityID, getComponentValue, SchemaOf } from "@latticexyz/recs";
import { filter, scan, merge, map } from "rxjs";
import { BlockIdToKey, BlockTypeKey } from "../../network/constants";
import { registerUIComponent } from "../engine";
import styled from "styled-components";
import { getBlockIconUrl } from "../../noa/constants";
import { filterNullish } from "@latticexyz/utils";

type BlockEvent = {
  blockNumber: number;
  blockType?: BlockTypeKey;
  action?: "add" | "remove";
};

type BlockSummaryElement = [
  number, // block number
  {
    [blockType in BlockTypeKey]: { add?: number; remove?: number };
  }
];

type BlockSummary = BlockSummaryElement[];

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
    pointer-events: all;
    cursor: pointer;
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
          config: { blockExplorer },
        },
      } = layers;

      // Group stream of component update events by block number
      return merge(
        blockNumber$.pipe(map<number, BlockEvent>((blockNumber) => ({ blockNumber }))),
        ecsEvent$
          .pipe(filter(isNetworkComponentUpdateEvent))
          // We're only visualizing the stream of new blocks so skip backfill
          .pipe(filter(({ txHash }) => txHash !== "worker" && txHash !== "cache"))
          .pipe(
            map<NetworkComponentUpdate, BlockEvent | undefined>(({ blockNumber, component, value, entity }) => {
              const componentKey = mappings[component];

              // Item component updates correspond to a mined terrain block
              if (componentKey === "Item") {
                const { value: entityId } = value as ComponentValue<SchemaOf<typeof Item>>;
                const blockType = BlockIdToKey[entityId as EntityID];
                return { blockNumber, blockType, action: "remove" };
              }

              // Position component updates correspond to a mined or placed ECS block
              if (componentKey === "Position") {
                const entityIndex = world.entityToIndex.get(entity);
                const blockTypeId = entityIndex != null ? getComponentValue(Item, entityIndex)?.value : undefined;
                if (!blockTypeId) {
                  return;
                }
                const blockType = BlockIdToKey[blockTypeId as EntityID];

                // If the update includes a position, it corresponds to a placed block
                if (value) {
                  return { blockNumber, blockType, action: "add" };
                }
                // otherwise it corresponds to a mined ecs block
                else {
                  return { blockNumber, blockType, action: "remove" };
                }
              }
            })
          )
          .pipe(filterNullish())
      )
        .pipe(filter((update) => update.blockType !== "Air"))
        .pipe(
          scan<BlockEvent, BlockSummary>((summary, event) => {
            const block =
              summary.find(([blockNumber]) => event.blockNumber === blockNumber) ||
              ([event.blockNumber, {}] as BlockSummaryElement);
            const otherBlocks = summary.filter(([blockNumber]) => event.blockNumber !== blockNumber) as BlockSummary;

            if (event.blockType && event.action) {
              block[1][event.blockType] = block[1][event.blockType] || { [event.action]: 0 };
              const current = block[1][event.blockType][event.action] || 0;
              block[1][event.blockType][event.action] = current + 1;
            }

            return [...otherBlocks, block].slice(-500);
          }, [] as BlockSummary),
          map((summary) => ({ summary, blockExplorer }))
        );
    },
    ({ summary, blockExplorer }) => {
      return (
        <BlockExplorerContainer>
          {summary.map(([blockNumber, block]) => (
            <div
              key={blockNumber}
              className="BlockExplorer-Block"
              onClick={() => window.open(blockExplorer + "/block/" + blockNumber)}
            >
              {blockNumber % 16 === 0 ? <div className="BlockExplorer-BlockNumber">{blockNumber}</div> : null}
              <div className="BlockExplorer-Actions">
                {Object.entries(block).map(([blockType, counts]) => (
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
                ))}
              </div>
            </div>
          ))}
        </BlockExplorerContainer>
      );
    }
  );
}
