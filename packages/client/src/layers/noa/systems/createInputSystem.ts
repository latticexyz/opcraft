import { getComponentValue, HasValue, runQuery, setComponent, updateComponent } from "@latticexyz/recs";
import { sleep } from "@latticexyz/utils";
import { NetworkLayer, BlockType } from "../../network";
import { FAST_MINING_DURATION, SPAWN_POINT } from "../constants";
import { HandComponent, HAND_COMPONENT } from "../engine/components/handComponent";
import { MiningBlockComponent, MINING_BLOCK_COMPONENT } from "../engine/components/miningBlockComponent";
import { getNoaComponent, getNoaComponentStrict } from "../engine/components/utils";
import { NoaLayer } from "../types";

export function createInputSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    noa,
    components: { SelectedSlot, UI, Tutorial, PreTeleportPosition },
    SingletonEntity,
    api: { toggleInventory, togglePlugins, placeSelectedItem, getSelectedBlockType, teleport },
    streams: { playerPosition$ },
  } = context;

  const {
    components: { Item, Position, GameConfig },
  } = network;

  // mine targeted block on on left click
  noa.inputs.bind("fire", "F");

  function canInteract() {
    return true;
  }

  function mineTargetedBlock() {
    if (noa.targetedBlock) {
      if (!canInteract()) return;
      const pos = noa.targetedBlock.position;
      if (pos[1] < -63) return;
      const miningComponent = getNoaComponentStrict<MiningBlockComponent>(
        noa,
        noa.playerEntity,
        MINING_BLOCK_COMPONENT
      );
      const creativeMode = getComponentValue(GameConfig, SingletonEntity)?.creativeMode;
      const handComponent = getNoaComponentStrict<HandComponent>(noa, noa.playerEntity, HAND_COMPONENT);
      if (miningComponent.active) {
        return;
      }
      miningComponent.active = true;
      handComponent.isMining;
      miningComponent.block = { x: pos[0], y: pos[1], z: pos[2] };

      if (creativeMode) {
        miningComponent.duration = 10;
      } else if (getSelectedBlockType() === BlockType.Bedrock) {
        miningComponent.duration = FAST_MINING_DURATION;
      }
      return miningComponent;
    }
  }

  let firePressed = false;
  noa.inputs.down.on("fire", async function () {
    if (!noa.container.hasPointerLock) return;

    firePressed = true;
    const miningComponent = mineTargetedBlock();
    while (firePressed) {
      if (!miningComponent?.duration) return;
      await sleep(miningComponent.duration + 100);
      if (firePressed) mineTargetedBlock();
    }
  });

  noa.inputs.up.on("fire", function () {
    if (!noa.container.hasPointerLock) return;

    firePressed = false;
    const miningComponent = getNoaComponentStrict<MiningBlockComponent>(noa, noa.playerEntity, MINING_BLOCK_COMPONENT);
    const handComponent = getNoaComponentStrict<HandComponent>(noa, noa.playerEntity, HAND_COMPONENT);
    miningComponent.active = false;
    handComponent.isMining = false;
  });

  noa.on("targetBlockChanged", (targetedBlock: { position: number[] }) => {
    if (!noa.container.hasPointerLock) return;

    const miningComponent = getNoaComponent<MiningBlockComponent>(noa, noa.playerEntity, MINING_BLOCK_COMPONENT);
    if (!miningComponent) return;
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
  noa.inputs.bind("alt-fire", "<mouse 3>", "R");

  noa.inputs.down.on("alt-fire", function () {
    if (!noa.container.hasPointerLock) return;

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
      if (!canInteract()) return;
      placeSelectedItem({ x: pos[0], y: pos[1], z: pos[2] });
    }
  });

  // Control selected slot with keys 1-9
  noa.inputs.bind("slot", "1", "2", "3", "4", "5", "6", "7", "8", "9");

  // Reset moving tutorial with W, A, S, D
  noa.inputs.bind("moving", "W", "A", "S", "D");
  noa.inputs.down.on("moving", () => {
    if (!noa.container.hasPointerLock) return;
    updateComponent(Tutorial, SingletonEntity, { moving: false });
  });

  noa.inputs.down.on("slot", (e) => {
    if (!noa.container.hasPointerLock) return;
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
    const showInventory = getComponentValue(UI, SingletonEntity)?.showInventory;
    if (!noa.container.hasPointerLock && !showInventory) return;
    toggleInventory();
    updateComponent(Tutorial, SingletonEntity, { inventory: false });
  });

  noa.inputs.bind("spawn", "O");
  noa.inputs.down.on("spawn", () => {
    if (!noa.container.hasPointerLock) return;
    setComponent(PreTeleportPosition, SingletonEntity, playerPosition$.getValue());
    teleport(SPAWN_POINT);
    updateComponent(Tutorial, SingletonEntity, { teleport: false });
  });

  noa.inputs.bind("preteleport", "P");
  noa.inputs.down.on("preteleport", () => {
    if (!noa.container.hasPointerLock) return;
    const preTeleportPosition = getComponentValue(PreTeleportPosition, SingletonEntity);
    if (!preTeleportPosition) return;
    teleport(preTeleportPosition);
    updateComponent(Tutorial, SingletonEntity, { teleport: false });
  });

  noa.inputs.bind("plugins", ";");
  noa.inputs.down.on("plugins", () => {
    togglePlugins();
  });
}
