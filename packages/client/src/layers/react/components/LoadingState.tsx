import React from "react";
import { BootScreen, registerUIComponent } from "../engine";
import { concat, map } from "rxjs";
import { getComponentValue } from "@latticexyz/recs";
import { GodID, SyncState } from "@latticexyz/network";
import styled from "styled-components";
import { LoadingBar } from "./common";

export function registerLoadingState() {
  registerUIComponent(
    "LoadingState",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const {
        components: { LoadingState },
        world,
      } = layers.network;

      return concat([1], LoadingState.update$).pipe(
        map(() => ({
          LoadingState,
          world,
        }))
      );
    },

    ({ LoadingState, world }) => {
      const GodEntityIndex = world.entityToIndex.get(GodID);

      const loadingState = GodEntityIndex == null ? null : getComponentValue(LoadingState, GodEntityIndex);
      if (loadingState == null) {
        return <BootScreen initialOpacity={1}>Connecting</BootScreen>;
      }

      if (loadingState.state !== SyncState.LIVE) {
        return (
          <BootScreen initialOpacity={1}>
            {loadingState.msg}
            <LoadingContainer>
              {Math.floor(loadingState.percentage)}%<Loading percentage={loadingState.percentage} />
            </LoadingContainer>
          </BootScreen>
        );
      }

      return null;
    }
  );
}

const LoadingContainer = styled.div`
  display: grid;
  justify-items: start;
  justify-content: start;
  align-items: center;
  height: 30px;
  width: 100%;
  grid-gap: 20px;
  grid-template-columns: auto 1fr;
`;

const Loading = styled(LoadingBar)`
  width: 100%;
`;
