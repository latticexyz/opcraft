import React, { useEffect, useState } from "react";
import { map, combineLatest, concat, of } from "rxjs";
import styled from "styled-components";
import { TILE_HEIGHT, TILE_WIDTH } from "../../phaser/constants";
import { registerUIComponent } from "../engine";
import { Container } from "./common";
import { getComponentValue } from "@latticexyz/recs";
import { JoinSocial } from "./JoinSocial";

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
              camera: { centerOnCoord },
            },
          },
          components: { UI },
          api: { toggleMap },
        },
        network: { SingletonEntity },
        noa: {
          api: { getCurrentPlayerPosition },
        },
      } = layers;

      return combineLatest([
        of({ centerOnCoord, toggleMap, getCurrentPlayerPosition }),
        concat(of(getComponentValue(UI, SingletonEntity)), UI.update$.pipe(map((update) => update.value[0]))),
      ]).pipe(map(([props, ui]) => ({ ...props, ui })));
    },
    ({ centerOnCoord, toggleMap, getCurrentPlayerPosition, ui }) => {
      const [view, setView] = useState(window.getView?.() ?? "map");

      // oh no, this is so gross
      useEffect(() => {
        const originalSetView = window.setView;
        if (!originalSetView) return;

        window.setView = (view) => {
          setView(view);
          return originalSetView(view);
        };
        return () => {
          window.setView = originalSetView;
        };
      }, []);

      return (
        <>
          <ViewToggle>
            <input
              id="MapUI-field-view-map"
              type="radio"
              name="view"
              value="map"
              checked={view === "map"}
              onChange={() => {
                const { x, z } = getCurrentPlayerPosition();
                centerOnCoord({ x, y: z }, TILE_WIDTH, TILE_HEIGHT);
                window.setView?.("map");
              }}
            />
            <label htmlFor="MapUI-field-view-map">Map</label>
            <input
              id="MapUI-field-view-game"
              type="radio"
              name="view"
              value="game"
              checked={view === "game"}
              onChange={() => {
                window.setView?.("game");
                // TODO: teleport to current map center position?
              }}
            />
            <label htmlFor="MapUI-field-view-game">Game</label>
          </ViewToggle>

          {view === "map" && (
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
          )}

          <Socials>
            <JoinSocial />
          </Socials>
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

const MapLayerToggle = styled(Container)`
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 150px;
  line-height: 1;
  pointer-events: all;
`;

const Socials = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
`;
