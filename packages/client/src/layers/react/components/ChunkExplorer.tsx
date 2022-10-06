import React from "react";
import styled from "styled-components";
import { Button, Container, Faded, Title } from "./common";
import { Coord } from "@latticexyz/utils";

export const ChunkExplorer: React.FC<{
  chunk: Coord;
  claim?: { stake: number; claimer: string };
  stake?: { value: number };
  api: { stake: (chunk: Coord) => void; claim: (chunk: Coord) => void };
}> = ({ chunk, claim, stake, api }) => {
  const stakeValue = stake?.value ?? 0;
  const claimValue = claim?.stake ?? 0;

  return (
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
  );
};

const ChunkContainer = styled(Container)`
  line-height: 1;
  pointer-events: all;
  min-width: 200px;
`;

const Buttons = styled.div`
  margin-top: 8px;
  display: grid;
  grid-gap: 9px;
  grid-auto-flow: column;
`;
