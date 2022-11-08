import React from "react";
import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { map, distinctUntilChanged } from "rxjs";
import styled from "styled-components";
import { getBiome, getHeight } from "../../network/api";
import { TILE_HEIGHT, TILE_WIDTH } from "../../phaser/constants";
import { registerUIComponent } from "../engine";
import { Container } from "./common";

// TODO: only show when on map view

export function registerMapUI() {
  registerUIComponent(
    "MapUI",
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
            Main: {
              input,
              maps: { Height, Heat },
            },
          },
        },
        network: { perlin },
      } = layers;

      return input.pointermove$.pipe(
        map(({ pointer }) => {
          const { x, y: z } = pixelCoordToTileCoord({ x: pointer.worldX, y: pointer.worldY }, TILE_WIDTH, TILE_HEIGHT);
          const biome = getBiome({ x, y: 0, z }, perlin);
          const y = getHeight({ x, y: 0, z }, biome, perlin);
          return { x, y, z, Height, Heat };
        }),
        distinctUntilChanged((a, b) => a.x === b.x && a.z === b.z)
      );
    },
    ({ x, y, z, Height, Heat }) => {
      return (
        <>
          <TileInfo>
            <p>X: {x}</p>
            <p>Y: {y}</p>
            <p>Z: {z}</p>
          </TileInfo>
          <MapLayerToggle>
            <p>
              <label>
                <input
                  type="checkbox"
                  defaultChecked={Heat.visible.current}
                  onChange={(event) => {
                    Heat.setVisible(event.target.checked);
                  }}
                />{" "}
                Show activity
              </label>
            </p>
            <p>
              <label>
                <input
                  type="checkbox"
                  defaultChecked={Height.visible.current}
                  onChange={(event) => {
                    Height.setVisible(event.target.checked);
                  }}
                />{" "}
                Show contours
              </label>
            </p>
          </MapLayerToggle>
        </>
      );
    }
  );
}

const TileInfo = styled(Container)`
  position: absolute;
  left: 20px;
  bottom: 20px;
  width: 100px;
  line-height: 1;
`;

const MapLayerToggle = styled(Container)`
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 150px;
  line-height: 1;
  pointer-events: all;
`;
