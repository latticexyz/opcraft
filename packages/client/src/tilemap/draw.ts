import { TILE_WIDTH, TILE_HEIGHT } from "../layers/phaser/constants";
import { gameTiles, heightTiles } from "./tiles";

// TODO: get phaser to load this in directly rather than saving static image

const tileTypes = Object.keys(gameTiles) as (keyof typeof gameTiles)[];
const heightTypes = Object.keys(heightTiles) as (keyof typeof heightTiles)[];

const canvas = document.createElement("canvas");
const tilesPerRow = Math.ceil(Math.sqrt(tileTypes.length + heightTypes.length));
canvas.width = TILE_WIDTH * tilesPerRow;
canvas.height = TILE_HEIGHT * tilesPerRow;

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Could not get canvas 2d context");

tileTypes.forEach((tile, i) => {
  const tileImage = gameTiles[tile];
  if (!tileImage) return;

  const image = new Image();
  image.onload = () => {
    // replace water with a plain blue square
    if (tile === "Water") {
      ctx.fillStyle = "rgba(43, 151, 214, 0.5)";
      // ctx.fillStyle = "hsla(202, 80%, 84%, 0.5)";
      ctx.fillRect((i % tilesPerRow) * TILE_WIDTH, Math.floor(i / tilesPerRow) * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
      return;
    }
    ctx.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      (i % tilesPerRow) * TILE_WIDTH,
      Math.floor(i / tilesPerRow) * TILE_HEIGHT,
      TILE_WIDTH,
      TILE_HEIGHT
    );
    ctx.globalAlpha = 1;
  };
  image.src = new URL(tileImage, window.location.origin).href;
});

heightTypes.forEach((key, i) => {
  const color = heightTiles[key];
  ctx.fillStyle = color;
  ctx.fillRect(
    ((tileTypes.length + i) % tilesPerRow) * TILE_WIDTH,
    Math.floor((tileTypes.length + i) / tilesPerRow) * TILE_HEIGHT,
    TILE_WIDTH,
    TILE_HEIGHT
  );
});

document.body.appendChild(canvas);
