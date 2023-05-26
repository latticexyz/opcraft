/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from "react";
import { registerUIComponent } from "../engine";
import { combineLatest, concat, map, Observable, of } from "rxjs";
import styled from "styled-components";
import { Balance } from "./Balance";
import { ChunkExplorer } from "./ChunkExplorer";
import { JoinSocial } from "./JoinSocial";
import { RegisterVoxelType } from "./RegisterVoxelType";
import { filterNullish } from "@latticexyz/utils";
import { ComponentValue, getComponentValue, SchemaOf, updateComponent } from "@latticexyz/recs";
import { Hint } from "./Hint";
import { Gold } from "./common";
import {RegisterCreation} from "./RegisterCreation";
import {SubmitAndTest} from "./SubmitAndTest";
import {SubmitHalfAdderTest} from "./SubmitHalfAdderTest";
import {SpawnCreation} from "./SpawnCreation";
import {SubmitNandTest} from "./SubmitNandTest";

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
          components: { Tutorial, VoxelSelection },
          SingletonEntity,
        },
      } = layers;

      const chunk$ = playerChunk$.pipe(
        map((chunk) => {
          const { stake, claim } = getStakeAndClaim(chunk);
          return { chunk, claim, stake, api: { stake: api.stake, claim: api.claim, getName: api.getName } };
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

      const voxelSelection$ = concat(
        of(getComponentValue(VoxelSelection, SingletonEntity)),
        VoxelSelection.update$.pipe(map((u) => u.value[0]))
      );

      return combineLatest<
        [ObservableType<typeof chunk$>, ObservableType<typeof balance$>, ObservableType<typeof tutorial$>, ObservableType<typeof voxelSelection$>]
      >([chunk$, balance$, tutorial$, voxelSelection$]).pipe(map((props) => ({ props, layers })));
    },
    ({ props, layers }) => {
      const [chunk, balance, tutorial, voxelSelection] = props;
      const {
        components: { Tutorial },
        SingletonEntity,
      } = layers.noa;

      function updateTutorial(update: Partial<ComponentValue<SchemaOf<typeof Tutorial>>>) {
        updateComponent(Tutorial, SingletonEntity, update);
      }

      return (
        <Wrapper>
          <Balance {...balance} />
          <ChunkExplorer {...chunk} />
          {/*{tutorial?.community && <JoinSocial onClose={() => updateTutorial({ community: false })} />}*/}
          {/*{<RegisterVoxelType layers={layers} onClose={() => updateTutorial({ community: false })} />}*/}
          { <RegisterCreation layers={layers} onClose={() => {console.log("closed")}} />}
          { <SubmitAndTest layers={layers} onClose={() => {console.log("closed")}} />}
          {<SubmitNandTest layers={layers} onClose={() => {console.log("closed")}} />}
          {/*{(voxelSelection?.points ?? []).length >= 4 && <SubmitHalfAdderTest layers={layers} onClose={() => {console.log("closed")}} />}*/}
          { <SpawnCreation layers={layers} onClose={() => {console.log("closed")}} />}
          {/*{tutorial?.moving && (*/}
          {/*  <Hint onClose={() => updateTutorial({ moving: false })}>*/}
          {/*    <Gold>Hint</Gold>: press <Gold>W, A, S, or D</Gold> to move around*/}
          {/*  </Hint>*/}
          {/*)}*/}
          {/*{tutorial?.mine && (*/}
          {/*  <Hint onClose={() => updateTutorial({ mine: false })}>*/}
          {/*    <Gold>Hint</Gold>: press and hold <Gold>left mouse</Gold> or <Gold>F</Gold> to mine a block*/}
          {/*  </Hint>*/}
          {/*)}*/}
          {/*{tutorial?.build && (*/}
          {/*  <Hint onClose={() => updateTutorial({ build: false })}>*/}
          {/*    <Gold>Hint</Gold>: press <Gold>right mouse</Gold> or <Gold>R</Gold> to place a block*/}
          {/*  </Hint>*/}
          {/*)}*/}
          {/*{tutorial?.inventory && (*/}
          {/*  <Hint onClose={() => updateTutorial({ inventory: false })}>*/}
          {/*    <Gold>Hint</Gold>: press <Gold>E</Gold> to open your inventory*/}
          {/*  </Hint>*/}
          {/*)}*/}
          {/*{!tutorial?.mine && tutorial?.claim && (*/}
          {/*  <Hint onClose={() => updateTutorial({ claim: false })}>*/}
          {/*    <Gold>Hint</Gold>: find a diamond, press <Gold>X</Gold> to stake it in a chunk, then press <Gold>C</Gold>{" "}*/}
          {/*    to claim the chunk*/}
          {/*  </Hint>*/}
          {/*)}*/}
          {/*{!tutorial?.mine && !tutorial?.inventory && tutorial?.craft && (*/}
          {/*  <Hint onClose={() => updateTutorial({ craft: false })}>*/}
          {/*    <Gold>Hint</Gold>: place wool on top of a flower in the crafting UI (top of inventory) to craft dyed wool*/}
          {/*  </Hint>*/}
          {/*)}*/}
          {/*{!tutorial?.inventory && !tutorial?.mine && !tutorial?.build && tutorial?.teleport && (*/}
          {/*  <Hint onClose={() => updateTutorial({ teleport: false })}>*/}
          {/*    <Gold>Hint</Gold>: press <Gold>O</Gold> to teleport to the spawn point, and <Gold>P</Gold> to back where*/}
          {/*    you were before*/}
          {/*  </Hint>*/}
          {/*)}*/}
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
