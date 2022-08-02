import { EntityID, getComponentValue, HasValue, runQuery, setComponent } from "@latticexyz/recs";
import { NetworkLayer, BlockType as BlockTypeEnum } from "../../network";
import { INDEX_TO_BLOCK_TYPE } from "../../react/components/ActionBar";
import { NoaLayer } from "../types";

export function createInputSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    noa,
    components: { SelectedSlot },
    SingletonEntity,
    api: { setCraftingTable },
  } = context;

  const {
    world,
    components: { BlockType, OwnedBy, Position },
    api: { build, mine },
    network: { connectedAddress },
  } = network;

  // clear targeted block on on left click
  noa.inputs.down.on("fire", function () {
    if (noa.targetedBlock) {
      const pos = noa.targetedBlock.position;
      mine({ x: pos[0], y: pos[1], z: pos[2] });
    }
  });

  // place a block on right click
  noa.inputs.down.on("alt-fire", function () {
    if (noa.targetedBlock) {
      const pos = noa.targetedBlock.adjacent;
      const targeted = noa.targetedBlock.position;

      // Open crafting UI if the targeted block is a crafting table
      if (
        runQuery([
          HasValue(Position, { x: targeted[0], y: targeted[1], z: targeted[2] }),
          HasValue(BlockType, { value: BlockTypeEnum.Crafting }),
        ]).size > 0
      ) {
        noa.container.setPointerLock(false);
        return setCraftingTable([]);
      }

      const blockIndex = getComponentValue(SelectedSlot, SingletonEntity)?.value ?? 1;
      const blockType = INDEX_TO_BLOCK_TYPE[blockIndex];
      const ownedEntitiesOfType = runQuery([
        HasValue(OwnedBy, { value: connectedAddress.get() }),
        HasValue(BlockType, { value: blockType }),
      ]);
      const blockEntityIndex = [...ownedEntitiesOfType][0];
      const blockEntity = blockEntityIndex != null ? world.entities[blockEntityIndex] : ("0x00" as EntityID);
      build(blockEntity, { x: pos[0], y: pos[1], z: pos[2] }, blockType);
    }
  });

  // add a key binding for "E" to do the same as alt-fire
  noa.inputs.bind("alt-fire", "E");

  // Control selected slot with keys 1-9
  noa.inputs.bind("slot", "1", "2", "3", "4", "5", "6", "7", "8", "9");
  noa.inputs.down.on("slot", (e) => {
    setComponent(SelectedSlot, SingletonEntity, { value: Number(e.key) });
  });
}
