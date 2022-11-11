import React, { useEffect, useState } from "react";
import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { map, distinctUntilChanged, of, filter, merge } from "rxjs";
import styled from "styled-components";
import { TILE_HEIGHT, TILE_WIDTH } from "../../phaser/constants";
import { registerUIComponent } from "../engine";
import { Button, CloseableContainer, Container, Gold } from "./common";
import { mapObject, VoxelCoord } from "@latticexyz/utils";
import { getChunkCoord, getChunkEntity } from "../../../utils/chunk";
import playerNames from "../../../../data/playerNames.json";
import chunkClaims from "../../../../data/chunkClaims.json";
import { getHighestTilesAt } from "../../phaser/getHighestTilesAt";

export function registerPosition() {
  registerUIComponent(
    "Position",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const {
        phaser: {
          scenes: {
            Main: { input },
          },
        },
        network: {
          perlin,
          components: { Position, Item, Position2D },
        },
        noa: {
          streams: { playerPosition$ },
          api: { teleport },
        },
      } = layers;

      const pointerPosition$ = input.pointermove$.pipe(
        map(({ pointer }) => {
          const { x, y: z } = pixelCoordToTileCoord({ x: pointer.worldX, y: pointer.worldY }, TILE_WIDTH, TILE_HEIGHT);
          const { y } = getHighestTilesAt({ x, z, perlin, Position, Item, Position2D }) ?? { y: 0 };
          return { x, y, z };
        })
      );

      const noaPlayerPosition$ = playerPosition$.pipe(filter(() => window.getView?.() === "game"));

      const position$ = merge(of({ x: 0, y: 0, z: 0 }), pointerPosition$, noaPlayerPosition$).pipe(
        map((position) => mapObject<VoxelCoord, VoxelCoord>(position, (value) => Math.round(value))),
        distinctUntilChanged((a, b) => a.x === b.x && a.y === b.y && a.z === b.z)
      );

      return position$.pipe(map((position) => ({ position, teleport })));
    },
    ({ position: { x, y, z }, teleport }) => {
      const chunkId = getChunkEntity(getChunkCoord({ x, y, z }));
      const claim = chunkClaims.find((c) => c.chunkId === chunkId);
      const owner = claim ? playerNames.find((p) => p.address === claim.claimer) : null;
      const ownerName = owner?.name ?? claim?.claimer.replace(/^(0x[0-9A-F]{3})[0-9A-F]+([0-9A-F]{4})$/i, "$1…$2");
      const [showTeleport, setShowTeleport] = useState(false);

      useEffect(() => {
        if (!showTeleport) return;
        const listener = (event: KeyboardEvent) => {
          if (event.key === "Escape") {
            setShowTeleport(false);
          }
        };
        window.addEventListener("keyup", listener);
        return () => window.removeEventListener("keyup", listener);
      }, [showTeleport, setShowTeleport]);

      return (
        <>
          <Position>
            {ownerName ? (
              <Container>
                <p>Chunk claimed by</p>
                <p>
                  <Gold>{ownerName}</Gold>
                </p>
              </Container>
            ) : null}

            <Container style={{ width: "100px" }}>
              <p>X: {x}</p>
              <p>Y: {y}</p>
              <p>Z: {z}</p>
              <div style={{ marginTop: "8px" }}>
                <Button onClick={() => setShowTeleport(true)}>Teleport</Button>
              </div>
            </Container>
          </Position>
          {showTeleport ? (
            <TeleportOverlay>
              <CloseableContainer onClose={() => setShowTeleport(false)}>
                <TeleportForm
                  onSubmit={(event) => {
                    event.preventDefault();
                    window.setView?.("game");
                    const formData = new FormData(event.currentTarget);
                    const getNumber = (key: string) => {
                      const value = formData.get(key);
                      if (typeof value === "string" && /^-?\d+/.test(value)) {
                        return parseInt(value);
                      }
                    };
                    teleport({ x: getNumber("x") ?? 0, y: getNumber("y") ?? 0, z: getNumber("z") ?? 0 });
                    setShowTeleport(false);
                  }}
                >
                  <div>
                    <label>
                      X:
                      <input type="number" name="x" defaultValue={x} autoFocus />
                    </label>
                    <label>
                      Y:
                      <input type="number" name="y" defaultValue={y} />
                    </label>
                    <label>
                      Z:
                      <input type="number" name="z" defaultValue={z} />
                    </label>
                  </div>
                  <Button type="submit">Teleport</Button>
                </TeleportForm>
              </CloseableContainer>
            </TeleportOverlay>
          ) : null}
        </>
      );
    }
  );
}

const Position = styled.div`
  position: absolute;
  left: 20px;
  bottom: 20px;
  line-height: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TeleportOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(31, 31, 31, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TeleportForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  line-height: 1;

  label {
    display: flex;
    gap: 4px;
    align-items: center;
    margin: 2px 0;
  }
  input {
    font-size: inherit;
    font-family: inherit;
    font-weight: inherit;
    color: #ccc;
    width: 120px;

    padding: 4px 6px;
    border: 2px solid #555;
    background: none;

    :focus {
      outline: none;
      color: #fff;
      border-color: #777;
    }
  }
`;
