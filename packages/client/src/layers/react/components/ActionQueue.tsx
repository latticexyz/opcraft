import React from "react";
import { registerUIComponent } from "../engine";
import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { map } from "rxjs";
import { ActionState } from "@latticexyz/std-client";
import styled from "styled-components";
import { Blocks } from "../../noa/constants";
import { Action as ActionQueueItem } from "./Action";

const ActionQueueList = styled.div`
  width: 240px;
  height: 100%;
  display: flex;
  gap: 6px;
  flex-grow: 1;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
  font-family: Minecraft;
  font-size: 13px;
  text-shadow: 1.5px 1.5px 0 #000;
`;

const ActionQueueItemContainer = styled.div`
  position: relative;
`;

const ActionPosition = styled.div`
  position: absolute;
  left: 100%;
  top: 0;
  bottom: 0;
  width: 100px;
  margin-left: 9px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
`;

export function registerActionQueue() {
  registerUIComponent(
    "ActionQueue",
    {
      rowStart: 6,
      rowEnd: 12,
      colStart: 1,
      colEnd: 3,
    },
    (layers) => {
      const {
        network: {
          actions: { Action },
        },
      } = layers;

      return Action.update$.pipe(
        map(() => ({
          Action,
        }))
      );
    },
    ({ Action }) => {
      return (
        <ActionQueueList>
          {[...getComponentEntities(Action)].map((e) => {
            const { state, metadata } = getComponentValueStrict(Action, e);
            const { actionType, coord, blockType } = metadata;
            const material = blockType && Blocks[blockType]?.material;
            const blockImage = (material && (Array.isArray(material) ? material[0] : material)) ?? undefined;
            return (
              <ActionQueueItemContainer key={e}>
                <ActionQueueItem state={state} icon={blockImage} title={`${actionType} tx`} description={blockType} />
                {/* TODO: conditionally render this for debugging? */}
                {coord ? (
                  <ActionPosition>
                    <div>X: {coord.x}</div>
                    <div>Y: {coord.y}</div>
                    <div>Z: {coord.z}</div>
                  </ActionPosition>
                ) : null}
              </ActionQueueItemContainer>
            );
          })}
        </ActionQueueList>
      );
    }
  );
}
