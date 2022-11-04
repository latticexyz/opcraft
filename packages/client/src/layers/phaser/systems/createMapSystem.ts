import { defineEnterSystem, defineRxSystem, getComponentValueStrict, Has } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";
import { BackgroundTiles, ForegroundTiles, HeightMapTiles } from "../assets/tilesets/opcraftTileset";
import { getBiome, getTerrainBlock, getHeight } from "../../network/api";
import { BlockIdToKey } from "../../network/constants";
import { isStructureChunk } from "../../network/api/terrain/occurrence";
import { STRUCTURE_CHUNK } from "../../network/api/terrain/constants";
import { Coord, CoordMap } from "@latticexyz/utils";
import { Subject } from "rxjs";
import { TILE_HEIGHT, TILE_WIDTH } from "../constants";
import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { ZoomLevel } from "../createZoomLevel";

// Draw the 2D map
export function createMapSystem(context: PhaserLayer, network: NetworkLayer) {
  const {
    components: { Position, Item },
    perlin,
  } = network;

  const {
    world,
    scenes: {
      Main: {
        input,
        maps: { Main, X2, X4, X8, X16 },
      },
    },
    chunks,
    zoomLevel$,
  } = context;

  const maps = {
    [ZoomLevel.X1]: Main,
    [ZoomLevel.X2]: X2,
    [ZoomLevel.X4]: X4,
    [ZoomLevel.X8]: X8,
    [ZoomLevel.X16]: X16,
  };

  const computedTiles = new CoordMap<boolean>();

  // Create a Subject to be able to send chunks through it manually
  // but also send chunks.addedChunks$ through it
  const addedChunks$ = new Subject<Coord>();
  chunks.addedChunks$.subscribe(addedChunks$);
  const newTile$ = new Subject<Coord>();

  // TODO: maybe move terrain exploration to webworker to reduce lags in main thread?
  defineRxSystem(world, newTile$, async ({ x, y: z }) => {
    const biome = getBiome({ x, y: 0, z }, perlin);
    const height = getHeight({ x, y: 0, z }, biome, perlin);
    const structureChunk = isStructureChunk({ biomeVector: biome, height, coord: { x, y: height + 1, z }, perlin });
    const heightLimit = structureChunk ? height + STRUCTURE_CHUNK : height;

    // TODO: do this better, with shaders or something instead of translucent color overlay
    const heightTile = HeightMapTiles[Math.max(-8, Math.min(8, Math.floor(height / 8)))];
    if (heightTile != null) {
      Main.putTileAt({ x, y: z }, heightTile, "HeightMap");
      // TODO: maybe we should use the center tile instead of the top left one
      if (x % 2 === 0 && z % 2 === 0) X2.putTileAt({ x: x / 2, y: z / 2 }, heightTile, "HeightMap");
      if (x % 4 === 0 && z % 4 === 0) X4.putTileAt({ x: x / 4, y: z / 4 }, heightTile, "HeightMap");
      if (x % 8 === 0 && z % 8 === 0) X8.putTileAt({ x: x / 8, y: z / 8 }, heightTile, "HeightMap");
      if (x % 16 === 0 && z % 16 === 0) X16.putTileAt({ x: x / 16, y: z / 16 }, heightTile, "HeightMap");
    }

    // iterate through Y position since perlin terrain may not have the highest placed block
    // TODO: is there a more efficient way to do this?
    // -> I think we should separately check for ECS blocks at this coord (and pre-process the ECS state to only contain the highest block)
    for (let y = heightLimit; y >= height - 1; y--) {
      const entityId = getTerrainBlock({ biome, height }, { x, y, z }, perlin);
      const blockType = BlockIdToKey[entityId];

      if (blockType === "Air") continue;

      const foregroundTile = ForegroundTiles[blockType];
      if (foregroundTile) {
        Main.putTileAt({ x, y: z }, foregroundTile, "Foreground");
        if (x % 2 === 0 && z % 2 === 0) X2.putTileAt({ x: x / 2, y: z / 2 }, foregroundTile, "Foreground");
        if (x % 4 === 0 && z % 4 === 0) X4.putTileAt({ x: x / 4, y: z / 4 }, foregroundTile, "Foreground");
        if (x % 8 === 0 && z % 8 === 0) X8.putTileAt({ x: x / 8, y: z / 8 }, foregroundTile, "Foreground");
        if (x % 16 === 0 && z % 16 === 0) X16.putTileAt({ x: x / 16, y: z / 16 }, foregroundTile, "Foreground");
        // Continue down y axis to get the background tile
        continue;
      }

      const backgroundTile = BackgroundTiles[blockType];
      if (backgroundTile) {
        Main.putTileAt({ x, y: z }, backgroundTile, "Background");
        // TODO: maybe we should use the center tile instead of the top left one
        if (x % 2 === 0 && z % 2 === 0) X2.putTileAt({ x: x / 2, y: z / 2 }, backgroundTile, "Background");
        if (x % 4 === 0 && z % 4 === 0) X4.putTileAt({ x: x / 4, y: z / 4 }, backgroundTile, "Background");
        if (x % 8 === 0 && z % 8 === 0) X8.putTileAt({ x: x / 8, y: z / 8 }, backgroundTile, "Background");
        if (x % 16 === 0 && z % 16 === 0) X16.putTileAt({ x: x / 16, y: z / 16 }, backgroundTile, "Background");
        // Stop drawing tile for this x, z
        break;
      }

      // Ignore flowers for now
      // if (!blockType.endsWith("Flower")) {
      //   console.log(`No background tile found for block type ${blockType}`);
      // }
    }
  });

  // Send new tiles through newTile$ when viewport changes
  defineRxSystem(world, addedChunks$, (chunk) => {
    const tilesPerChunk = chunks.chunkSize / TILE_HEIGHT;
    for (let xOffset = 0; xOffset < tilesPerChunk; xOffset++) {
      for (let yOffset = 0; yOffset < tilesPerChunk; yOffset++) {
        const x = chunk.x * tilesPerChunk + xOffset;
        const y = chunk.y * tilesPerChunk + yOffset;

        const coord = { x, y };

        const { zoomLevel } = zoomLevel$.getValue();
        if (zoomLevel === ZoomLevel.X2 && (x % 2 !== 0 || y % 2 !== 0)) continue;
        if (zoomLevel === ZoomLevel.X4 && (x % 4 !== 0 || y % 4 !== 0)) continue;
        if (zoomLevel === ZoomLevel.X8 && (x % 8 !== 0 || y % 8 !== 0)) continue;
        if (zoomLevel === ZoomLevel.X16 && (x % 16 !== 0 || y % 16 !== 0)) continue;

        if (!computedTiles.get(coord)) {
          newTile$.next(coord);
          computedTiles.set(coord, true);
        }
      }
    }
  });

  // Send current chunks through addedChunks$ when zoom changes
  defineRxSystem(world, zoomLevel$, () => {
    for (const chunk of chunks.visibleChunks.current.coords()) {
      addedChunks$.next(chunk);
    }
  });

  // React to zoom level changes
  defineRxSystem(world, zoomLevel$, ({ zoomLevel }) => {
    // Toggle maps when zooming out
    for (const [mapZoomLevel, map] of Object.entries(maps)) {
      map.setVisible(zoomLevel === parseInt(mapZoomLevel));
    }
  });

  // TODO: draw map for ECS tiles
  defineEnterSystem(world, [Has(Position), Has(Item)], ({ entity }) => {
    console.log("entered", entity);
    const position = getComponentValueStrict(Position, entity);
    const item = getComponentValueStrict(Item, entity).value;
    // Main.putTileAt(position, Textures[item]);
  });

  // TODO: highlight tile on hover, then use click instead of double click to teleport
  //       or optionally click once to select a tile, then click a button in UI to teleport
  defineRxSystem(world, input.doubleClick$, (pointer) => {
    console.log("dblclick", pointer);
    const pixelCoord = { x: pointer.worldX, y: pointer.worldY };
    const { x, y: z } = pixelCoordToTileCoord(pixelCoord, TILE_WIDTH, TILE_HEIGHT);
    const biome = getBiome({ x, y: 0, z }, perlin);
    const y = getHeight({ x, y: 0, z }, biome, perlin);

    const params = new URLSearchParams(window.location.search);
    params.set("view", "game");
    params.set("x", x.toString());
    params.set("y", y.toString());
    params.set("z", z.toString());
    window.location.search = params.toString();
  });
}
