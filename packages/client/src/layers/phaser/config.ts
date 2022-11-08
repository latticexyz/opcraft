import {
  defineSceneConfig,
  AssetType,
  defineScaleConfig,
  defineMapConfig,
  defineCameraConfig,
} from "@latticexyz/phaserx";
import { Assets, Maps, Scenes, TILE_HEIGHT, TILE_WIDTH } from "./constants";
import opcraftTileset from "./assets/tilesets/opcraft-tileset.png";

export const phaserConfig = {
  sceneConfig: {
    [Scenes.Main]: defineSceneConfig({
      assets: {
        [Assets.OPCraftTileset]: { type: AssetType.Image, key: Assets.OPCraftTileset, path: opcraftTileset },
        tileHover: { type: AssetType.Image, key: "tileHover", path: "/assets/blocks/11-Glass.png" },
      },
      maps: {
        [Maps.Main]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64, // tile size * tile amount
          tileWidth: TILE_WIDTH,
          tileHeight: TILE_HEIGHT,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Background: { tilesets: ["Default"], hasHueTintShader: false },
              Foreground: { tilesets: ["Default"], hasHueTintShader: false },
            },
            defaultLayer: "Background",
          },
        }),
        [Maps.X2]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64 * 2, // tile size * tile amount
          tileWidth: TILE_WIDTH * 2,
          tileHeight: TILE_HEIGHT * 2,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Background: { tilesets: ["X2"], hasHueTintShader: false },
              Foreground: { tilesets: ["X2"], hasHueTintShader: false },
            },
            defaultLayer: "Background",
          },
        }),
        [Maps.X4]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64 * 4, // tile size * tile amount
          tileWidth: TILE_WIDTH * 4,
          tileHeight: TILE_HEIGHT * 4,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Background: { tilesets: ["X4"], hasHueTintShader: false },
              Foreground: { tilesets: ["X4"], hasHueTintShader: false },
            },
            defaultLayer: "Background",
          },
        }),
        [Maps.X8]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64 * 16, // tile size * tile amount
          tileWidth: TILE_WIDTH * 8,
          tileHeight: TILE_HEIGHT * 8,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Background: { tilesets: ["X8"], hasHueTintShader: false },
              Foreground: { tilesets: ["X8"], hasHueTintShader: false },
            },
            defaultLayer: "Background",
          },
        }),
        [Maps.X16]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64 * 64, // tile size * tile amount
          tileWidth: TILE_WIDTH * 16,
          tileHeight: TILE_HEIGHT * 16,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Background: { tilesets: ["X16"], hasHueTintShader: false },
              Foreground: { tilesets: ["X16"], hasHueTintShader: false },
            },
            defaultLayer: "Background",
          },
        }),
        [Maps.Heat]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64 * 64, // tile size * tile amount
          tileWidth: TILE_WIDTH * 16,
          tileHeight: TILE_HEIGHT * 16,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Main: { tilesets: ["X16"], hasHueTintShader: false },
            },
            defaultLayer: "Main",
          },
        }),
        [Maps.Height]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64, // tile size * tile amount
          tileWidth: TILE_WIDTH,
          tileHeight: TILE_HEIGHT,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Main: { tilesets: ["Default"], hasHueTintShader: false },
            },
            defaultLayer: "Main",
          },
        }),
        [Maps.HeightX2]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64 * 2, // tile size * tile amount
          tileWidth: TILE_WIDTH * 2,
          tileHeight: TILE_HEIGHT * 2,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Main: { tilesets: ["X2"], hasHueTintShader: false },
            },
            defaultLayer: "Main",
          },
        }),
        [Maps.HeightX4]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64 * 4, // tile size * tile amount
          tileWidth: TILE_WIDTH * 4,
          tileHeight: TILE_HEIGHT * 4,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Main: { tilesets: ["X4"], hasHueTintShader: false },
            },
            defaultLayer: "Main",
          },
        }),
        [Maps.HeightX8]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64 * 16, // tile size * tile amount
          tileWidth: TILE_WIDTH * 8,
          tileHeight: TILE_HEIGHT * 8,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Main: { tilesets: ["X8"], hasHueTintShader: false },
            },
            defaultLayer: "Main",
          },
        }),
        [Maps.HeightX16]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64 * 64, // tile size * tile amount
          tileWidth: TILE_WIDTH * 16,
          tileHeight: TILE_HEIGHT * 16,
          backgroundTile: [0],
          animationInterval: Number.MAX_SAFE_INTEGER,
          layers: {
            layers: {
              Main: { tilesets: ["X16"], hasHueTintShader: false },
            },
            defaultLayer: "Main",
          },
        }),
      },
      sprites: {
        // [Sprites.Settlement]: {
        //   assetKey: Assets.MainAtlas,
        //   frame: "sprites/resources/crystal.png",
        // },
      },
      animations: [],
      tilesets: {
        Default: { assetKey: Assets.OPCraftTileset, tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT },
        X2: { assetKey: Assets.OPCraftTileset, tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT },
        X4: { assetKey: Assets.OPCraftTileset, tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT },
        X8: { assetKey: Assets.OPCraftTileset, tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT },
        X16: { assetKey: Assets.OPCraftTileset, tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT },
      },
    }),
  },
  scale: defineScaleConfig({
    parent: "phaser-game",
    zoom: 2,
    mode: Phaser.Scale.NONE,
  }),
  cameraConfig: defineCameraConfig({
    phaserSelector: "phaser-game",
    pinchSpeed: 1,
    wheelSpeed: 1,
    maxZoom: 4,
    minZoom: 1 / 128,
  }),
  cullingChunkSize: TILE_HEIGHT * 16,
};
