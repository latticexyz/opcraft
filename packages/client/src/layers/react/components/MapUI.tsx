import React from "react";
import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { map, distinctUntilChanged, combineLatest, concat, of, filter, merge } from "rxjs";
import styled from "styled-components";
import { getBiome, getHeight } from "../../network/api";
import { TILE_HEIGHT, TILE_WIDTH } from "../../phaser/constants";
import { registerUIComponent } from "../engine";
import { Container } from "./common";
import { getComponentValue } from "@latticexyz/recs";
import { mapObject, VoxelCoord } from "@latticexyz/utils";

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
        noa: {
          streams: { playerPosition$ },
        },
      } = layers;

      const pointerPosition$ = input.pointermove$.pipe(
        map(({ pointer }) => {
          const { x, y: z } = pixelCoordToTileCoord({ x: pointer.worldX, y: pointer.worldY }, TILE_WIDTH, TILE_HEIGHT);
          const biome = getBiome({ x, y: 0, z }, perlin);
          const y = getHeight({ x, y: 0, z }, biome, perlin);
          return { x, y, z };
        })
      );

      const noaPlayerPosition$ = playerPosition$.pipe(filter(() => window.getView?.() === "game"));

      const position$ = merge(of({ x: 0, y: 0, z: 0 }), pointerPosition$, noaPlayerPosition$).pipe(
        map((position) => mapObject<VoxelCoord, VoxelCoord>(position, (value) => Math.round(value))),
        distinctUntilChanged((a, b) => a.x === b.x && a.z === b.z)
      );

      return combineLatest([
        position$,
        concat(of(getComponentValue(UI, SingletonEntity)), UI.update$.pipe(map((update) => update.value[0]))),
      ]).pipe(map(([position, ui]) => ({ position, ui, maps, toggleMap })));
    },
    ({ position: { x, y, z }, ui, toggleMap }) => {
      const currentView = window.getView?.();
      return (
        <>
          <ViewToggle>
            <input
              id="MapUI-field-view-map"
              type="radio"
              name="view"
              value="map"
              defaultChecked={currentView === "map"}
              onChange={() => {
                window.setView?.("map");
                // TODO: move map to current player position?
              }}
            />
            <label htmlFor="MapUI-field-view-map">Map</label>
            <input
              id="MapUI-field-view-game"
              type="radio"
              name="view"
              value="game"
              defaultChecked={currentView === "game"}
              onChange={() => {
                window.setView?.("game");
                // TODO: teleport to current map center position?
              }}
            />
            <label htmlFor="MapUI-field-view-game">Game</label>
          </ViewToggle>
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

const ViewToggle = styled(Container)`
  position: absolute;
  left: 20px;
  top: 20px;
  line-height: 1;
  pointer-events: all;

  input[type="radio"] {
    display: none;
  }
  label {
    padding: 4px 6px;
    cursor: pointer;
    border-radius: 4px;
  }
  label:hover {
    background-color: #444;
  }
  input:checked + label {
    background-color: #060;
  }
`;

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
