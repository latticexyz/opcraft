import { namespaceWorld } from "@latticexyz/recs";
import { createChunks, createPhaserEngine } from "@latticexyz/phaserx";
import { phaserConfig } from "./config";
import { NetworkLayer } from "../network";
import { createMapSystem, createTileHoverSystem } from "./systems";
import { NoaLayer } from "../noa";
import { TILE_HEIGHT } from "./constants";

/**
 * The Phaser layer is responsible for rendering game objects to the screen.
 */
export async function createPhaserLayer(network: NetworkLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(network.world, "phaser");

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {};

  // --- PHASER ENGINE SETUP --------------------------------------------------------
  const { game, scenes, dispose: disposePhaser } = await createPhaserEngine(phaserConfig);
  world.registerDisposer(disposePhaser);

  const chunks = createChunks(scenes.Main.camera.worldView$, TILE_HEIGHT * 64, TILE_HEIGHT * 64); // Tile size in pixels * Tiles per chunk

  // --- LAYER CONTEXT --------------------------------------------------------------
  const context = {
    world,
    components,
    network,
    game,
    scenes,
    chunks,
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createMapSystem(context, network);
  createTileHoverSystem(context, network);

  return context;
}
