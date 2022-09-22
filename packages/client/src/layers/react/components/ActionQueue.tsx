import React from "react";
import { registerUIComponent } from "../engine";
import { getComponentEntities, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { map } from "rxjs";
import { ActionStateString, ActionState } from "@latticexyz/std-client";
import styled from "styled-components";

const ActionQueueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px;
  width: 400px;
`;

const ActionQueueItem = styled.div`
  display: flex;
  gap: 6px;
  background: rgba(31, 31, 31, 0.6);
  padding: 6px;
`;

const ActionLabel = styled.div`
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ActionStatus = styled.div<{ state: ActionState }>`
  width: 50%;
  background: red;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => {
    switch (props.state) {
      case ActionState.Complete:
        return "hsl(120, 40%, 60%)";
      case ActionState.WaitingForTxEvents:
        return "hsl(220, 50%, 60%)";
      default:
        return "hsl(0, 0%, 40%)";
    }
  }};
`;

export function registerActionQueue() {
  registerUIComponent(
    "ActionQueue",
    {
      rowStart: 4,
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
            const actionData = getComponentValueStrict(Action, e);
            const state = ActionStateString[actionData.state as ActionState];
            // Horrible hack to get data since I don't know how to query it yet
            // TODO: figure out how to get structured data
            // TODO: figure out how to get item being acted on (e.g. mined or placed)
            const entityId = Action.world.entities[e];
            const [actionType, position] = entityId.split("+");
            const [x, y, z] = position.split("/");
            return (
              <ActionQueueItem key={`action${e}`} title={`${Action.world.entities[e]}: ${state}`}>
                <ActionLabel>
                  {actionType} ({x}, {y}, {z})
                </ActionLabel>
                <ActionStatus state={actionData.state as ActionState}>{state}</ActionStatus>
              </ActionQueueItem>
            );
          })}
        </ActionQueueList>
      );
    }
  );
}
