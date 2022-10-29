import {
  defineQuery,
  HasValue,
  Has,
  getComponentValue,
  EntityID,
  hasComponent,
  setComponent,
  defineRxSystem,
  removeComponent,
  runQuery,
} from "@latticexyz/recs";
import { computedToStream } from "@latticexyz/utils";
import { switchMap } from "rxjs";
import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export function createInventoryIndexSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    components: { OwnedBy, Item },
    network: { connectedAddress },
  } = network;

  const {
    world,
    components: { InventoryIndex },
  } = context;

  const connectedAddress$ = computedToStream(connectedAddress);

  const update$ = connectedAddress$.pipe(
    switchMap(
      (address) =>
        defineQuery([HasValue(OwnedBy, { value: address }), Has(Item)], {
          runOnInit: true,
        }).update$
    )
  );

  defineRxSystem(world, update$, (update) => {
    const blockID = getComponentValue(Item, update.entity)?.value as EntityID;
    const blockIndex = blockID && world.entityToIndex.get(blockID);

    if (blockIndex == null) return;

    // Assign the first free inventory index
    if (!hasComponent(InventoryIndex, blockIndex)) {
      const values = [...InventoryIndex.values.value.values()]; // lol
      let i = 0;
      while (values.includes(i)) i++;
      setComponent(InventoryIndex, blockIndex, { value: i });
    }
  });
}
