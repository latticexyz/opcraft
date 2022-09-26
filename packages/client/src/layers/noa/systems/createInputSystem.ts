import { getComponentValue, HasValue, runQuery, setComponent } from "@latticexyz/recs";
import { NetworkLayer, BlockType } from "../../network";
import { INDEX_TO_BLOCK } from "../../react/components/ActionBar";
import { HandComponent, HAND_COMPONENT } from "../engine/components/handComponent";
import { MiningBlockComponent, MINING_BLOCK_COMPONENT } from "../engine/components/miningBlockComponent";
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
    components: { Item, OwnedBy },
    indexers: { Position },
    api: { build, mine },
    network: { connectedAddress },
    actions: { withOptimisticUpdates },
  } = network;

  // clear targeted block on on left click
  noa.inputs.down.on("fire", function () {
    if (noa.targetedBlock) {
      const pos = noa.targetedBlock.position;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const miningComponent: MiningBlockComponent = noa.entities.getState(noa.playerEntity, MINING_BLOCK_COMPONENT);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const handComponent: HandComponent = noa.entities.getState(noa.playerEntity, HAND_COMPONENT);
      if (miningComponent.active) {
        return;
      }
      miningComponent.active = true;
      handComponent.isMining = true;
      miningComponent.block = { x: pos[0], y: pos[1], z: pos[2] };
    }
  });

  noa.inputs.up.on("fire", function () {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const miningComponent: MiningBlockComponent = noa.entities.getState(noa.playerEntity, MINING_BLOCK_COMPONENT);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const handComponent: HandComponent = noa.entities.getState(noa.playerEntity, HAND_COMPONENT);
    miningComponent.active = false;
    handComponent.isMining = false;
  });

  noa.on("targetBlockChanged", (targetedBlock: { position: number[] }) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const miningComponent: MiningBlockComponent = noa.entities.getState(noa.playerEntity, MINING_BLOCK_COMPONENT);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const handComponent: HandComponent = noa.entities.getState(noa.playerEntity, HAND_COMPONENT);
    if (!targetedBlock) {
      return;
    }
    const {
      position: [x, y, z],
    } = targetedBlock;
    if (miningComponent.block.x !== x || miningComponent.block.y !== y || miningComponent.block.z !== z) {
      miningComponent.active = false;
      handComponent.isMining = false;
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
          HasValue(Item, { value: BlockType.Crafting }),
        ]).size > 0
      ) {
        noa.container.setPointerLock(false);
        return setCraftingTable([]);
      }

      const blockIndex = getComponentValue(SelectedSlot, SingletonEntity)?.value ?? 1;
      const blockID = INDEX_TO_BLOCK[blockIndex];
      const ownedEntitiesOfType = [
        ...runQuery([
          HasValue(withOptimisticUpdates(OwnedBy), { value: connectedAddress.get() }),
          HasValue(Item, { value: blockID }),
        ]),
      ];
      const blockEntityIndex = ownedEntitiesOfType[0];
      if (blockEntityIndex == null) return console.warn("no owned block of type", blockID);
      const blockEntity = world.entities[blockEntityIndex];
      build(blockEntity, { x: pos[0], y: pos[1], z: pos[2] });
    }
  });

  // add a key binding for "E" to do the same as alt-fire
  noa.inputs.bind("alt-fire", "E");

  // Control selected slot with keys 1-9
  noa.inputs.bind("slot", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "P", "O", "I", "U");
  noa.inputs.down.on("slot", (e) => {
    console.log(e.key);
    const mappings: { [key: number | string]: number } = { 0: 10, P: 11, O: 12, I: 13, U: 14 };
    const key = mappings[e.key as string | number] ?? Number(e.key);
    setComponent(SelectedSlot, SingletonEntity, { value: key });
  });
}
