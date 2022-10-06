import React from "react";
import { registerUIComponent } from "../engine";
import { map } from "rxjs";
import styled from "styled-components";
import { Button, Container, Faded, Title } from "./common";

export function registerChunkExplorer() {
  registerUIComponent(
    "ChunkExplorer",
    {
      rowStart: 2,
      rowEnd: 13,
      colStart: 8,
      colEnd: 13,
    },
    (layers) => {
      const {
        network: { api },
        noa: {
          streams: { playerChunk$ },
          api: { getStakeAndClaim },
        },
      } = layers;
      return playerChunk$.pipe(
        map((chunk) => {
          const { stake, claim } = getStakeAndClaim(chunk);
          return { chunk, claim, stake, api: { stake: api.stake, claim: api.claim } };
        })
      );
    },
    ({ chunk, claim, stake, api }) => {
      const stakeValue = stake?.value ?? 0;
      const claimValue = claim?.stake ?? 0;

      return (
        <Wrapper>
          <ChunkContainer>
            <p>
              <Title>Chunk</Title> ({chunk.x}, {chunk.y})
            </p>
            <p>Stake: {stakeValue}</p>
            <p>Claim: {claim ? `${claimValue} (${claim.claimer.substring(0, 6)}...)` : `none`}</p>
            <Buttons>
              <Button onClick={() => api.stake(chunk)}>
                Stake <Faded>(X)</Faded>
              </Button>
              {stakeValue > claimValue ? (
                <Button onClick={() => api.claim(chunk)}>
                  Claim<Faded>(C)</Faded>
                </Button>
              ) : null}
            </Buttons>
          </ChunkContainer>
        </Wrapper>
      );
    }
  );
}

const Wrapper = styled.div`
  display: grid;
  justify-items: end;
  padding: 20px;
`;

const ChunkContainer = styled(Container)`
  line-height: 1;
  pointer-events: all;
`;

const Buttons = styled.div`
  margin-top: 8px;
  display: grid;
  grid-gap: 9px;
  grid-auto-flow: column;
`;
