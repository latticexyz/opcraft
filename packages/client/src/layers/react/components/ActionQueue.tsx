import React from "react";
import { registerUIComponent } from "../engine";
import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { map } from "rxjs";
import { ActionState } from "@latticexyz/std-client";
import styled from "styled-components";
import { PendingIcon } from "./icons/PendingIcon";
import { CheckIcon } from "./icons/CheckIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { Blocks } from "../../noa/constants";

const ActionQueueList = styled.div`
  width: 100%;
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

const ActionQueueItem = styled.div`
  box-shadow: 0 0 0 3px #555, 0 0 0 5px #000;
  background: #222;
  margin: 5px;
  border-radius: 3px;
  display: flex;
  gap: 12px;
  padding: 8px;
  position: relative;

  transition: opacity 300ms ease-in-out;
  &.pending {
    opacity: 0.4;
  }
`;

const ActionImage = styled.div`
  width: 32px;
  height: 32px;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ActionLabel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
`;

const ActionIndicatorContainer = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 1rem;

  .spin {
    animation: spin 1s linear infinite;
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  }

  &.red {
    color: hsl(0, 60%, 60%);
  }
  &.green {
    color: hsl(120, 60%, 60%);
  }
  &.gray {
    color: hsl(0, 0%, 60%);
  }
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

const ActionIndicator = ({ state }: { state: ActionState }) => {
  switch (state) {
    case ActionState.Complete:
      return (
        <ActionIndicatorContainer className="green">
          <CheckIcon />
        </ActionIndicatorContainer>
      );
    case ActionState.Failed:
    case ActionState.Cancelled:
      return (
        <ActionIndicatorContainer className="red">
          <CloseIcon />
        </ActionIndicatorContainer>
      );
    case ActionState.WaitingForTxEvents:
    case ActionState.Executing:
      return (
        <ActionIndicatorContainer className="gray">
          <PendingIcon className="spin" />
        </ActionIndicatorContainer>
      );
    default:
      return null;
  }
};

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
          {/* <ActionQueueItem>
            <img src="/assets/blocks/4-Grass_block-side.png" />
            <ActionLabel>
              <div style={{ color: "#fe0", textTransform: "capitalize" }}>mine tx</div>
              <div>Dirt Block</div>
            </ActionLabel>
            <ActionIndicator state={ActionState.Complete} />
            <ActionPosition>
              <div>X: -1500</div>
              <div>Y: 10</div>
              <div>Z: -700</div>
            </ActionPosition>
          </ActionQueueItem>

          <ActionQueueItem>
            <img src="/assets/blocks/4-Grass_block-side.png" />
            <ActionLabel>
              <div style={{ color: "#fe0", textTransform: "capitalize" }}>mine tx</div>
              <div>Dirt Block</div>
            </ActionLabel>
            <ActionIndicator state={ActionState.Failed} />
            <ActionPosition>
              <div>X: -1500</div>
              <div>Y: 10</div>
              <div>Z: -700</div>
            </ActionPosition>
          </ActionQueueItem>

          <ActionQueueItem>
            <img src="/assets/blocks/4-Grass_block-side.png" />
            <ActionLabel>
              <div style={{ color: "#fe0", textTransform: "capitalize" }}>mine tx</div>
              <div>Dirt Block</div>
            </ActionLabel>
            <ActionIndicator state={ActionState.WaitingForTxEvents} />
            <ActionPosition>
              <div>X: -1500</div>
              <div>Y: 10</div>
              <div>Z: -700</div>
            </ActionPosition>
          </ActionQueueItem>

          <ActionQueueItem className="pending">
            <img src="/assets/blocks/4-Grass_block-side.png" />
            <ActionLabel>
              <div style={{ color: "#fe0", textTransform: "capitalize" }}>mine tx</div>
              <div>Dirt Block</div>
            </ActionLabel>
            <ActionIndicator state={ActionState.Executing} />
            <ActionPosition>
              <div>X: -1500</div>
              <div>Y: 10</div>
              <div>Z: -700</div>
            </ActionPosition>
          </ActionQueueItem> */}

          {[...getComponentEntities(Action)].map((e) => {
            const { state, metadata } = getComponentValueStrict(Action, e);
            const { actionType, coord, blockType } = metadata;
            const material = blockType && Blocks[blockType]?.material;
            const blockImage = material && (Array.isArray(material) ? material[0] : material);
            return (
              <ActionQueueItem key={e} className={state <= ActionState.Executing ? "pending" : ""}>
                <ActionImage>{blockImage ? <img src={blockImage} /> : null}</ActionImage>
                <ActionLabel>
                  <div style={{ color: "#fe0", textTransform: "capitalize" }}>{actionType} tx</div>
                  <div>{blockType}</div>
                </ActionLabel>
                <ActionIndicator state={state} />
                {coord ? (
                  <ActionPosition>
                    <div>X: {coord.x}</div>
                    <div>Y: {coord.y}</div>
                    <div>Z: {coord.z}</div>
                  </ActionPosition>
                ) : null}
              </ActionQueueItem>
            );
          })}
        </ActionQueueList>
      );
    }
  );
}
