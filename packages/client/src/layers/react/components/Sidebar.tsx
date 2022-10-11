/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from "react";
import { registerUIComponent } from "../engine";
import { combineLatest, map, Observable, of } from "rxjs";
import styled from "styled-components";
import { Balance } from "./Balance";
import { ChunkExplorer } from "./ChunkExplorer";

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

      return combineLatest<[ObservableType<typeof chunk$>, ObservableType<typeof balance$>]>([chunk$, balance$]).pipe(
        map((props) => ({ props }))
      );
    },
    ({ props }) => {
      const [chunk, balance] = props;
      return (
        <Wrapper>
          <Balance {...balance} />
          <ChunkExplorer {...chunk} />
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
