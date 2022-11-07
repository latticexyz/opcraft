import { defineComponentSystem } from "@latticexyz/recs";
import { getChunkCoordFromEntityId } from "../../../utils/chunk";
import { NetworkLayer } from "../../network";
import { HeightMapTiles } from "../assets/tilesets/opcraftTileset";
import { PhaserLayer } from "../types";

export function createHeatmapSystem(context: PhaserLayer, network: NetworkLayer) {
  const {
    scenes: {
      Main: {
        maps: { Heat },
      },
    },
  } = context;

  const {
    world,
    components: { Chunk },
  } = network;

  defineComponentSystem(world, Chunk, ({ entity, value }) => {
    const entityId = world.entities[entity];
    if (!entityId) return console.warn("unknown chunk entity: ", entity);
    const coord = getChunkCoordFromEntityId(entityId);
    const changes = value[0]?.changes ?? 0;
    const tile = HeightMapTiles[Math.min(8, Math.floor(changes / 20))];
    if (tile != null) Heat.putTileAt(coord, tile, "Main");
  });
}
