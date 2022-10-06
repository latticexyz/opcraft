import React from "react";
import { registerUIComponent } from "../engine";
import { concat, interval, map, of } from "rxjs";
import styled from "styled-components";
import { getNoaComponentStrict } from "../../noa/engine/components/utils";
import { PositionComponent, POSITION_COMPONENT } from "../../noa/engine/components/defaultComponent";
import { getChunkCoord, getChunkEntity } from "../../../utils/chunk";
import { getStakeEntity } from "../../../utils/stake";
import { getComponentValue } from "@latticexyz/recs";

export function registerChunkExplorer() {
  registerUIComponent(
    "ChunkExplorer",
    {
      rowStart: 2,
      rowEnd: 13,
      colStart: 11,
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
    ({ coord, chunk, claim, stake, api }) => {
      return (
        <Wrapper>
          <>
            Position: ({coord.x}, {coord.y}, {coord.z})<br />
            Chunk: ({chunk.x}, {chunk.y})<br />
            Stake: {stake ? `${JSON.stringify(stake)}` : `no stake`}
            <br />
            Claim: {claim ? `${claim.stake} by ${claim.claimer}` : `no claim`}
            <br />
            <Button onClick={() => api.stake(chunk)}>Stake</Button>
            <Button onClick={() => api.claim(chunk)}>Claim</Button>
          </>
        </Wrapper>
      );
    }
  );
}

const Wrapper = styled.div`
  background-color: black;
  font-size: 13px;
  pointer-events: all;
`;

const Button = styled.button``;
