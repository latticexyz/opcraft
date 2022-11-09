import { NetworkLayer } from "../types";
import { itemTypes } from "../../../../data/itemTypes.json";
import positionData from "../../../../data/positionsPerItem.json";
import { createEntity, EntityID, getComponentValue, setComponent, updateComponent, withValue } from "@latticexyz/recs";
import { SyncState } from "@latticexyz/network";
import { getChunkCoord, getChunkEntity } from "../../../utils/chunk";
import { sleep } from "@latticexyz/utils";
import { BlockIdToKey } from "../constants";

export async function createInitSystem(context: NetworkLayer) {
  const {
    world,
    components: { Position, Position2D, Item, LoadingState, Chunk },
    SingletonEntity,
  } = context;

  let i = 0;

  setComponent(LoadingState, SingletonEntity, { state: SyncState.INITIAL, msg: "Initializing", percentage: 0 });
  console.log("Initializing");

  const items = new Map<number, string>(itemTypes.map(([id, num]) => [num, id] as [number, string]));

  for (const [itemIndex, positions] of (positionData as any).positionsPerItem) {
    const item = items.get(itemIndex);
    if (!item) {
      console.warn("Unknown item type", itemIndex);
      continue;
    }
    for (const [x, y, z] of positions as [number, number, number][]) {
      createEntity(world, [
        withValue(Position, { x, y, z }),
        withValue(Position2D, { x, y: z }),
        withValue(Item, { value: item }),
      ]);
      const chunkEntity = world.registerEntity({ id: getChunkEntity(getChunkCoord({ x, y, z })) });
      const prevChanges = getComponentValue(Chunk, chunkEntity)?.changes ?? 0;
      setComponent(Chunk, chunkEntity, { changes: prevChanges + 1 });
      await sleep(0);
      i++;
      setComponent(LoadingState, SingletonEntity, {
        state: SyncState.INITIAL,
        msg: "Initializing " + BlockIdToKey[item as EntityID],
        percentage: i / positions.length,
      });
    }
    i = 0;
  }

  // Done initializing
  setComponent(LoadingState, SingletonEntity, { state: SyncState.LIVE, msg: "live", percentage: 100 });
}
