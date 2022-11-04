import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { map, distinctUntilChanged } from "rxjs";
import styled from "styled-components";
import { getBiome, getHeight } from "../../network/api";
import { TILE_HEIGHT, TILE_WIDTH } from "../../phaser/constants";
import { registerUIComponent } from "../engine";
import { Container } from "./common";

export function registerTileInfo() {
  registerUIComponent(
    "TileHover",
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
        network: { perlin },
      } = layers;

      return input.pointermove$.pipe(
        map(({ pointer }) => {
          const { x, y: z } = pixelCoordToTileCoord({ x: pointer.worldX, y: pointer.worldY }, TILE_WIDTH, TILE_HEIGHT);
          const biome = getBiome({ x, y: 0, z }, perlin);
          const y = getHeight({ x, y: 0, z }, biome, perlin);
          return { x, y, z };
        }),
        distinctUntilChanged((a, b) => a.x === b.x && a.z === b.z)
      );
    },
    ({ x, y, z }) => {
      return (
        <TileInfo>
          <p>X: {x}</p>
          <p>Y: {y}</p>
          <p>Z: {z}</p>
        </TileInfo>
      );
    }
  );
}

const TileInfo = styled(Container)`
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 20px;
  width: 100px;
  line-height: 1;
`;
