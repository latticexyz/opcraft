import {
  defineSceneConfig,
  AssetType,
  defineScaleConfig,
  defineMapConfig,
  defineCameraConfig,
} from "@latticexyz/phaserx";
import { Sprites, Assets, Maps, Scenes, TILE_HEIGHT, TILE_WIDTH } from "./constants";
import {
  Tileset as OverworldTileset,
  TileAnimations as OverworldTileAnimations,
} from "../phaser/assets/tilesets/overworldTileset";
import overworldTileset from "./assets/tilesets/overworld-tileset.png";
import opcraftTileset from "./assets/tilesets/opcraft-tileset.png";
const ANIMATION_INTERVAL = 200;

export const phaserConfig = {
  sceneConfig: {
    [Scenes.Main]: defineSceneConfig({
      assets: {
        // TODO: we need to create a tileset from the OPCraft textures and load it here
        [Assets.OverworldTileset]: { type: AssetType.Image, key: Assets.OverworldTileset, path: overworldTileset },
        // [Assets.MainAtlas]: {
        //   type: AssetType.MultiAtlas,
        //   key: Assets.MainAtlas,
        //   path: "/atlases/sprites/atlas.json",
        //   options: {
        //     imagePath: "/atlases/sprites/",
        //   },
        // },
        [Assets.OPCraftTileset]: { type: AssetType.Image, key: Assets.OPCraftTileset, path: opcraftTileset },
      },
      maps: {
        [Maps.Main]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64, // tile size * tile amount
          tileWidth: TILE_WIDTH,
          tileHeight: TILE_HEIGHT,
          backgroundTile: [0],
          animationInterval: ANIMATION_INTERVAL,
          // tileAnimations: OverworldTileAnimations,
          layers: {
            layers: {
              Background: { tilesets: ["Default"], hasHueTintShader: true },
              HeightMap: { tilesets: ["Default"], hasHueTintShader: true },
              Foreground: { tilesets: ["Default"], hasHueTintShader: true },
            },
            defaultLayer: "Background",
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
    minZoom: 1 / 16,
  }),
  cullingChunkSize: TILE_HEIGHT * 16,
};
