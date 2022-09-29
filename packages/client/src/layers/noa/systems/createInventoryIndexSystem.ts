import {
  defineQuery,
  HasValue,
  Has,
  getComponentValue,
  EntityID,
  hasComponent,
  setComponent,
  defineRxSystem,
  getEntitiesWithValue,
  removeComponent,
  runQuery,
} from "@latticexyz/recs";
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

  const ownedByMeQuery = defineQuery([HasValue(OwnedBy, { value: connectedAddress.get() }), Has(Item)], {
    runOnInit: true,
  });

  defineRxSystem(world, ownedByMeQuery.update$, (update) => {
    const blockID = getComponentValue(Item, update.entity)?.value as EntityID;
    const blockIndex = blockID && world.entityToIndex.get(blockID);

    if (blockIndex == null) return;

    const quantityOfType = runQuery([
      HasValue(OwnedBy, { value: connectedAddress.get() }),
      HasValue(Item, { value: blockID }),
    ]).size;

    // Remove the entity index of blocks the player doesn't own, so new blocks can take its place
    if (quantityOfType == 0) return removeComponent(InventoryIndex, blockIndex);

    // Assign the first free inventory index
    if (!hasComponent(InventoryIndex, blockIndex)) {
      const values = [...InventoryIndex.values.value.values()]; // lol
      let i = 0;
      while (values.includes(i)) i++;
      setComponent(InventoryIndex, blockIndex, { value: i });
    }
  });
}
