import React from "react";
import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { map, distinctUntilChanged, combineLatest, concat, of } from "rxjs";
import styled from "styled-components";
import { getBiome, getHeight } from "../../network/api";
import { TILE_HEIGHT, TILE_WIDTH } from "../../phaser/constants";
import { registerUIComponent } from "../engine";
import { Container } from "./common";
import { getComponentValue } from "@latticexyz/recs";

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
            Main: { input, maps },
          },
          components: { UI },
          api: { toggleMap },
        },
        network: { perlin, SingletonEntity },
      } = layers;

      return combineLatest([
        input.pointermove$.pipe(
          map(({ pointer }) => {
            const { x, y: z } = pixelCoordToTileCoord(
              { x: pointer.worldX, y: pointer.worldY },
              TILE_WIDTH,
              TILE_HEIGHT
            );
            const biome = getBiome({ x, y: 0, z }, perlin);
            const y = getHeight({ x, y: 0, z }, biome, perlin);
            return { x, y, z };
          }),
          distinctUntilChanged((a, b) => a.x === b.x && a.z === b.z)
        ),
        concat(of(getComponentValue(UI, SingletonEntity)), UI.update$.pipe(map((update) => update.value[0]))),
      ]).pipe(map(([pointer, ui]) => ({ pointer, ui, maps, toggleMap })));
    },
    ({ pointer: { x, y, z }, ui, toggleMap }) => {
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
                  defaultChecked={ui?.activity}
                  onChange={(event) => {
                    toggleMap("activity", event.target.checked);
                  }}
                />{" "}
                Show activity
              </label>
            </p>
            <p>
              <label>
                <input
                  type="checkbox"
                  defaultChecked={ui?.height}
                  onChange={(event) => {
                    toggleMap("height", event.target.checked);
                  }}
                />{" "}
                Show contours
              </label>
            </p>
            <p>
              <label>
                <input
                  type="checkbox"
                  defaultChecked={ui?.terrain}
                  onChange={(event) => {
                    toggleMap("terrain", event.target.checked);
                  }}
                />{" "}
                Show terrain
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
