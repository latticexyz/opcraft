import { getComponentValue, HasValue, runQuery, setComponent, updateComponent } from "@latticexyz/recs";
import { NetworkLayer, BlockType } from "../../network";
import { HandComponent, HAND_COMPONENT } from "../engine/components/handComponent";
import { MiningBlockComponent, MINING_BLOCK_COMPONENT } from "../engine/components/miningBlockComponent";
import { getNoaComponentStrict } from "../engine/components/utils";
import { NoaLayer } from "../types";

export function createInputSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    noa,
    components: { SelectedSlot, UI },
    SingletonEntity,
    api: { toggleInventory, placeSelectedItem },
  } = context;

  const {
    components: { Item, Position },
  } = network;

  // clear targeted block on on left click
  noa.inputs.down.on("fire", function () {
    if (noa.targetedBlock) {
      const pos = noa.targetedBlock.position;
      const miningComponent = getNoaComponentStrict<MiningBlockComponent>(
        noa,
        noa.playerEntity,
        MINING_BLOCK_COMPONENT
      );
      const handComponent = getNoaComponentStrict<HandComponent>(noa, noa.playerEntity, HAND_COMPONENT);
      if (miningComponent.active) {
        return;
      }
      miningComponent.active = true;
      handComponent.isMining = true;
      miningComponent.block = { x: pos[0], y: pos[1], z: pos[2] };
    }
  });

  noa.inputs.up.on("fire", function () {
    const miningComponent = getNoaComponentStrict<MiningBlockComponent>(noa, noa.playerEntity, MINING_BLOCK_COMPONENT);
    const handComponent = getNoaComponentStrict<HandComponent>(noa, noa.playerEntity, HAND_COMPONENT);
    miningComponent.active = false;
    handComponent.isMining = false;
  });

  noa.on("targetBlockChanged", (targetedBlock: { position: number[] }) => {
    const miningComponent = getNoaComponentStrict<MiningBlockComponent>(noa, noa.playerEntity, MINING_BLOCK_COMPONENT);
    const handComponent = getNoaComponentStrict<HandComponent>(noa, noa.playerEntity, HAND_COMPONENT);
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
  noa.inputs.unbind("alt-fire"); // Unbind to remove the default binding of "E"
  noa.inputs.bind("alt-fire", "<mouse 3>");
  noa.inputs.down.on("alt-fire", function () {
    console.log("alt-fire");
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
        return toggleInventory(true, true);
      }

      placeSelectedItem({ x: pos[0], y: pos[1], z: pos[2] });
    }
  });

  // Control selected slot with keys 1-9
  noa.inputs.bind("slot", "1", "2", "3", "4", "5", "6", "7", "8", "9");

  noa.inputs.down.on("slot", (e) => {
    console.log(e.key);
    const key = Number(e.key) - 1;
    setComponent(SelectedSlot, SingletonEntity, { value: key });
  });

  noa.inputs.bind("componentbrowser", "`");
  noa.inputs.down.on("componentbrowser", () => {
    const showComponentBrowser = getComponentValue(UI, SingletonEntity)?.showComponentBrowser;
    updateComponent(UI, SingletonEntity, { showComponentBrowser: !showComponentBrowser });
  });

  noa.inputs.bind("inventory", "E");
  noa.inputs.down.on("inventory", () => {
    toggleInventory();
  });
}
