import styled from "styled-components";
import { TILE_HEIGHT, TILE_WIDTH } from "../../phaser/constants";
import { registerUIComponent } from "../engine";

export function registerTileHover() {
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
      } = layers;

      return input.pointermove$;
    },
    ({ pointer }) => {
      console.log("pointer", pointer);
      return (
        <>
          <HoveredTile
            style={{
              position: "absolute",
              // not sure why I need x2 here, maybe pixel density?
              left: Math.floor(pointer.x / TILE_WIDTH) * TILE_WIDTH * 2,
              top: Math.floor(pointer.y / TILE_HEIGHT) * TILE_HEIGHT * 2,
              width: TILE_WIDTH * 2,
              height: TILE_HEIGHT * 2,
            }}
          >
            hello world
          </HoveredTile>
        </>
      );
    }
  );
}

const HoveredTile = styled.div`
  // border: 4px solid red;
  box-shadow: 0 0 10px 4px rgba(255, 255, 255, 0.5);
`;
