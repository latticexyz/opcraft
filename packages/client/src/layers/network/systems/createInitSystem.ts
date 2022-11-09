import { NetworkLayer } from "../types";
import { itemTypes } from "../../../../data/itemTypes.json";
import positionData from "../../../../data/positionsPerItem.json";
import { createEntity, EntityID, getComponentValue, setComponent, withValue } from "@latticexyz/recs";
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
  let percentage = 0;
  const length = Object.entries((positionData as any).positionsPerItem).reduce(
    (acc, [, arr]) => ((arr as any)[0] === 48 ? acc : acc + (arr as any)[1].length),
    0
  );

  setComponent(LoadingState, SingletonEntity, { state: SyncState.INITIAL, msg: "Initializing", percentage: 0 });
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
      const p = Math.floor((i++ / length) * 100);
      if (p !== percentage && p % 5 === 0) {
        percentage = p;
        setComponent(LoadingState, SingletonEntity, {
          state: SyncState.INITIAL,
          msg: `Initializing world (${BlockIdToKey[item as EntityID]}`,
          percentage,
        });
        // This is needed to allow the main thead to context switch and update the loading bar
        await sleep(0);
      }
    }
  }

  // Done initializing
  setComponent(LoadingState, SingletonEntity, { state: SyncState.LIVE, msg: "live", percentage: 100 });
}