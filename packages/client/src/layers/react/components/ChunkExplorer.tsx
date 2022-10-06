import React from "react";
import { registerUIComponent } from "../engine";
import { concat, interval, map, of } from "rxjs";
import styled from "styled-components";
import { getNoaComponentStrict } from "../../noa/engine/components/utils";
import { PositionComponent, POSITION_COMPONENT } from "../../noa/engine/components/defaultComponent";
import { getChunkCoord, getChunkEntity } from "../../../utils/chunk";
import { getStakeEntity } from "../../../utils/stake";
import { getComponentValue } from "@latticexyz/recs";
import { Button, Container, Title } from "./common";

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
        network: {
          components: { Claim, Stake },
          network: { connectedAddress },
          world,
          api,
        },
        noa: { noa },
      } = layers;
      return concat(of(1), interval(200)).pipe(
        map(() => {
          const { position } = getNoaComponentStrict<PositionComponent>(noa, noa.playerEntity, POSITION_COMPONENT);
          if (!position) return null;
          const coord = { x: Math.floor(position[0]), y: Math.floor(position[1]), z: Math.floor(position[2]) };
          const chunk = getChunkCoord(coord);
          const chunkEntityIndex = world.entityToIndex.get(getChunkEntity(chunk));
          const claim = chunkEntityIndex == null ? null : getComponentValue(Claim, chunkEntityIndex);
          const stakeEntityIndex = world.entityToIndex.get(getStakeEntity(chunk, connectedAddress.get() || "0x00"));
          const stake = stakeEntityIndex == null ? null : getComponentValue(Stake, stakeEntityIndex);
          return { coord, chunk, claim, stake, api: { stake: api.stake, claim: api.claim } };
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
              <Button onClick={() => api.stake(chunk)}>Stake</Button>
              {stakeValue > claimValue ? <Button onClick={() => api.claim(chunk)}>Claim</Button> : null}
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
