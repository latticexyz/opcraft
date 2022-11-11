import { getComponentValue, namespaceWorld, SchemaOf, setComponent, updateComponent } from "@latticexyz/recs";
import { createChunks, createPhaserEngine } from "@latticexyz/phaserx";
import { phaserConfig } from "./config";
import { NetworkLayer } from "../network";
import { createMapSystem, createTileHoverSystem, createInputSystem, createHeatmapSystem } from "./systems";
import { TILE_HEIGHT, ZoomLevel } from "./constants";
import { createZoomLevel } from "./createZoomLevel";
import { defineUIComponent } from "./components";

/**
 * The Phaser layer is responsible for rendering game objects to the screen.
 */
export async function createPhaserLayer(network: NetworkLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(network.world, "phaser");
  const { SingletonEntity } = network;

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    UI: defineUIComponent(world),
  };

  // Set initial values
  setComponent(components.UI, SingletonEntity, { terrain: true, height: true, activity: true });

  // --- PHASER ENGINE SETUP --------------------------------------------------------
  const { game, scenes, dispose: disposePhaser } = await createPhaserEngine(phaserConfig);
  world.registerDisposer(disposePhaser);
  scenes.Main.camera.setZoom(1 / 2);

  const chunks = createChunks(scenes.Main.camera.worldView$, TILE_HEIGHT * 64, TILE_HEIGHT * 64); // Tile size in pixels * Tiles per chunk

  // --- API -----------------------------------------------------------------------
  const { Main, X2, X4, X8, X16, Height, HeightX2, HeightX4, HeightX8, HeightX16 } = scenes.Main.maps;
  const maps = {
    terrain: {
      [ZoomLevel.X1]: Main,
      [ZoomLevel.X2]: X2,
      [ZoomLevel.X4]: X4,
      [ZoomLevel.X8]: X8,
      [ZoomLevel.X16]: X16,
    },
    height: {
      [ZoomLevel.X1]: Height,
      [ZoomLevel.X2]: HeightX2,
      [ZoomLevel.X4]: HeightX4,
      [ZoomLevel.X8]: HeightX8,
      [ZoomLevel.X16]: HeightX16,
    },
  };

  function toggleMap(type: keyof SchemaOf<typeof components.UI>, visible?: boolean) {
    visible = visible ?? Boolean(getComponentValue(components.UI, SingletonEntity)?.[type]);
    updateComponent(components.UI, SingletonEntity, { [type]: visible });
  }

  // --- LAYER CONTEXT --------------------------------------------------------------
  const context = {
    world,
    components,
    network,
    game,
    scenes,
    chunks,
    zoomLevel$: createZoomLevel(scenes.Main.camera.zoom$),
    maps,
    api: { toggleMap },
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createMapSystem(context, network);
  createTileHoverSystem(context, network);
  createInputSystem(context, network);
  createHeatmapSystem(context, network);

  return context;
}
