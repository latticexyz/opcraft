import { defineRxSystem, EntityID, getComponentValueStrict, getEntitiesWithValue } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";
import { BackgroundTiles, ForegroundTiles, HeightMapTiles } from "../assets/tilesets/opcraftTileset";
import { getBiome, getTerrainBlock, getHeight } from "../../network/api";
import { BlockIdToKey } from "../../network/constants";
import { isStructureChunk } from "../../network/api/terrain/occurrence";
import { STRUCTURE_CHUNK } from "../../network/api/terrain/constants";
import { Coord, CoordMap } from "@latticexyz/utils";
import { ZoomLevel } from "../createZoomLevel";
import { Subject } from "rxjs";
import { TILE_HEIGHT } from "../constants";

const StepSizePerZoomLevel = {
  [ZoomLevel.X1]: 1,
  [ZoomLevel.X2]: 2,
  [ZoomLevel.X4]: 4,
  [ZoomLevel.X8]: 8,
  [ZoomLevel.X16]: 16,
};

/**
 * System reacts to viewport changes and draws the map data (ecs, procgen) to the phaser tilemap
 */
export function createMapSystem(context: PhaserLayer, network: NetworkLayer) {
  // Extract relevant data from the context objects
  const {
    components: { Position, Item, Position2D },
    perlin,
  } = network;
  const {
    world,
    scenes: {
      Main: {
        maps: { Main, X2, X4, X8, X16 },
      },
    },
    chunks,
    zoomLevel$,
  } = context;

  // Setup local variables
  const computedTiles = new CoordMap<boolean>();
  const addedChunks$ = new Subject<Coord>();
  chunks.addedChunks$.subscribe(addedChunks$);
  const newTile$ = new Subject<Coord>();
  const maps = {
    [ZoomLevel.X1]: Main,
    [ZoomLevel.X2]: X2,
    [ZoomLevel.X4]: X4,
    [ZoomLevel.X8]: X8,
    [ZoomLevel.X16]: X16,
  };

  /**
   * Draw the given tile at the given coord on the given layer on all maps
   */
  function drawTile(x: number, y: number, tile: number, layer: "HeightMap" | "Foreground" | "Background") {
    for (const [zoom, map] of Object.entries(maps)) {
      const stepSize = StepSizePerZoomLevel[parseInt(zoom) as ZoomLevel];
      if (x % stepSize === 0 && y % stepSize === 0) map.putTileAt({ x: x / stepSize, y: y / stepSize }, tile, layer);
    }
  }

  /**
   * Compute the block type (ecs, procgen) at each coordinate coming through the newTile$ stream
   * and draw it on the phaser tilemap
   */
  defineRxSystem(world, newTile$, async ({ x, y: z }) => {
    const biome = getBiome({ x, y: 0, z }, perlin);
    let height = getHeight({ x, y: 0, z }, biome, perlin);
    const structureChunk = isStructureChunk({ biomeVector: biome, height, coord: { x, y: height + 1, z }, perlin });
    let heightLimit = structureChunk ? height + STRUCTURE_CHUNK : height;

    let foregroundTile: number | undefined;
    let backgroundTile: number | undefined;

    // First check ecs blocks at this 2D coordinate
    const ecsBlocks = [...getEntitiesWithValue(Position2D, { x, y: z })]
      .map((entity) => ({
        entity,
        position: getComponentValueStrict(Position, entity),
      }))
      .sort((a, b) => a.position.y - b.position.y)
      .reverse();

    for (const { entity, position } of ecsBlocks) {
      const item = getComponentValueStrict(Item, entity).value;
      const blockType = BlockIdToKey[item as EntityID];
      foregroundTile = ForegroundTiles[blockType];
      backgroundTile = BackgroundTiles[blockType];
      height = position.y;
      heightLimit = position.y - 1;
      if (backgroundTile) break;
    }

    const heightTile = HeightMapTiles[Math.max(-8, Math.min(8, Math.floor(height / 8)))];
    if (heightTile != null) drawTile(x, z, heightTile, "HeightMap");

    // If no background ecs block was found at this 2D coordinate, compute the procgen terrain block at this coordinate
    if (backgroundTile == null) {
      // Draw height map tile
      for (let y = heightLimit; y >= height - 1; y--) {
        const entityId = getTerrainBlock({ biome, height }, { x, y, z }, perlin);
        const blockType = BlockIdToKey[entityId];
        if (blockType === "Air") continue;
        foregroundTile = foregroundTile ?? ForegroundTiles[blockType];
        backgroundTile = BackgroundTiles[blockType];
        if (backgroundTile != null) break;
      }
    }

    // Draw the foreground and background tiles to the tilemap
    if (foregroundTile != null) drawTile(x, z, foregroundTile, "Foreground");
    if (backgroundTile != null) drawTile(x, z, backgroundTile, "Background");
  });

  /**
   * Compute new relevant (= not computed yet and visible in current zoom level) tiles
   * in the chunks coming through the addedChunk$ stream
   */
  defineRxSystem(world, addedChunks$, (chunk) => {
    const tilesPerChunk = chunks.chunkSize / TILE_HEIGHT;
    const { zoomLevel } = zoomLevel$.getValue();
    const stepSize = StepSizePerZoomLevel[zoomLevel];

    for (let xOffset = 0; xOffset < tilesPerChunk; xOffset += stepSize) {
      for (let yOffset = 0; yOffset < tilesPerChunk; yOffset += stepSize) {
        const x = chunk.x * tilesPerChunk + xOffset;
        const y = chunk.y * tilesPerChunk + yOffset;
        const coord = { x, y };

        if (!computedTiles.get(coord)) {
          newTile$.next(coord);
          computedTiles.set(coord, true);
        }
      }
    }
  });

  /**
   * React to zoom level changes by sending chunks in the current viewport through addedChunks$
   * (because they might include tiles that weren't relevant in the previous zoom level but are relevant now)
   */
  defineRxSystem(world, zoomLevel$, () => {
    for (const chunk of chunks.visibleChunks.current.coords()) {
      addedChunks$.next(chunk);
    }
  });

  /**
   * React to zoom level changes by enabling/disabling tilemaps maps relevant/irrelevant to the new zoom level
   */
  defineRxSystem(world, zoomLevel$, ({ zoomLevel }) => {
    // Toggle maps when zooming out
    for (const [mapZoomLevel, map] of Object.entries(maps)) {
      map.setVisible(zoomLevel === parseInt(mapZoomLevel));
    }
  });
}
