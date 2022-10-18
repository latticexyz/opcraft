/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from "react";
import { registerUIComponent } from "../engine";
import { combineLatest, concat, map, Observable, of } from "rxjs";
import styled from "styled-components";
import { Balance } from "./Balance";
import { ChunkExplorer } from "./ChunkExplorer";
import { JoinSocial } from "./JoinSocial";
import { filterNullish } from "@latticexyz/utils";
import { getComponentValue, updateComponent } from "@latticexyz/recs";

type ObservableType<S extends Observable<unknown>> = S extends Observable<infer T> ? T : never;

export function registerSidebar() {
  registerUIComponent(
    "Sidebar",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 8,
      colEnd: 13,
    },
    (layers) => {
      const {
        network: {
          api,
          faucet,
          network: { signer, connectedAddressChecksummed },
          streams: { balanceGwei$ },
        },
        noa: {
          streams: { playerChunk$ },
          api: { getStakeAndClaim },
          components: { Tutorial },
          SingletonEntity,
        },
      } = layers;

      const chunk$ = playerChunk$.pipe(
        map((chunk) => {
          const { stake, claim } = getStakeAndClaim(chunk);
          return { chunk, claim, stake, api: { stake: api.stake, claim: api.claim } };
        })
      );

      const balance$ = of(0).pipe(
        map(() => ({
          address: connectedAddressChecksummed.get()!,
          signer: signer.get()!,
          faucet,
          balanceGwei$,
        }))
      );

      const tutorial$ = concat(
        of(getComponentValue(Tutorial, SingletonEntity)),
        Tutorial.update$.pipe(map((u) => u.value[0]))
      );

      return combineLatest<
        [ObservableType<typeof chunk$>, ObservableType<typeof balance$>, ObservableType<typeof tutorial$>]
      >([chunk$, balance$, tutorial$]).pipe(map((props) => ({ props, layers })));
    },
    ({ props, layers }) => {
      const [chunk, balance, tutorial] = props;
      const {
        components: { Tutorial },
        SingletonEntity,
      } = layers.noa;

      return (
        <Wrapper>
          <Balance {...balance} />
          <ChunkExplorer {...chunk} />
          {tutorial?.community && (
            <JoinSocial onClose={() => updateComponent(Tutorial, SingletonEntity, { community: false })} />
          )}
        </Wrapper>
      );
    }
  );
}

const Wrapper = styled.div`
  display: grid;
  justify-items: end;
  grid-gap: 10px;
  padding: 50px 20px;
`;
