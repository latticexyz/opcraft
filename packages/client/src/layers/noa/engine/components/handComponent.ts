import * as BABYLON from "@babylonjs/core";
import { Engine } from "noa-engine";
import { EntityIndex, getComponentValue, HasValue, runQuery } from "@latticexyz/recs";
import { NetworkLayer } from "../../../network";
import { INDEX_TO_BLOCK } from "../../../react/components/ActionBar";
import { Material } from "@babylonjs/core";
import { BlockIdToKey, BlockTypeKey } from "../../../network/constants";
import { defineSelectedSlotComponent } from "../../components";
import {
  IDLE_ANIMATION_BOX_BLOCK,
  IDLE_ANIMATION_BOX_HAND,
  MINING_ANIMATION_BOX_BLOCK,
  MINING_ANIMATION_BOX_HAND,
} from "../hand";

export interface HandComponent {
  isMining: boolean;
  handMesh: BABYLON.Mesh;
  blockMesh: BABYLON.Mesh;
  blockMaterials: { [key in BlockTypeKey]?: Material };
  __id: number;
}

export const HAND_COMPONENT = "HAND_COMPONENT";

export function registerHandComponent(
  noa: Engine,
  networkLayer: NetworkLayer,
  SelectedSlot: ReturnType<typeof defineSelectedSlotComponent>,
  SingletonEntity: EntityIndex
) {
  const { Item, OwnedBy } = networkLayer.components;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: HAND_COMPONENT,
    state: { isMining: false, handMesh: null, blockMesh: null, blockMaterial: null },
    system: function (dt: number, states: HandComponent[]) {
      for (let i = 0; i < states.length; i++) {
        const { handMesh, isMining, blockMesh, blockMaterials } = states[i];
        const id = states[i].__id;
        if (id === noa.playerEntity) {
          // NOTE: for now just animate / change the material of the player hand
          const selectedSlot = getComponentValue(SelectedSlot, SingletonEntity)?.value ?? 1;
          const matchingBlocks = runQuery([
            HasValue(OwnedBy, { value: networkLayer.network.connectedAddress.get() }),
            HasValue(Item, { value: INDEX_TO_BLOCK[selectedSlot] }),
          ]);
          const amount = matchingBlocks.size;
          const blockTypeKey = BlockIdToKey[INDEX_TO_BLOCK[selectedSlot]];
          if (amount > 0 && blockMaterials[blockTypeKey] !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            blockMesh.material = blockMaterials[blockTypeKey]!;
            handMesh.visibility = 0;
            blockMesh.visibility = 1;
          } else {
            handMesh.visibility = 1;
            blockMesh.visibility = 0;
          }
          if (isMining && handMesh.animations[0].name.includes("idle")) {
            handMesh.animations.pop();
            handMesh.animations.push(MINING_ANIMATION_BOX_HAND);
            blockMesh.animations.pop();
            blockMesh.animations.push(MINING_ANIMATION_BOX_BLOCK);
            const scene = noa.rendering.getScene();
            scene.stopAnimation(handMesh);
            scene.stopAnimation(blockMesh);
            scene.beginAnimation(handMesh, 0, 100, true);
            scene.beginAnimation(blockMesh, 0, 100, true);
          } else if (!isMining && handMesh.animations[0].name.includes("mining")) {
            handMesh.animations.pop();
            handMesh.animations.push(IDLE_ANIMATION_BOX_HAND);
            blockMesh.animations.pop();
            blockMesh.animations.push(IDLE_ANIMATION_BOX_BLOCK);
            const scene = noa.rendering.getScene();
            scene.stopAnimation(handMesh);
            scene.stopAnimation(blockMesh);
            scene.beginAnimation(handMesh, 0, 100, true);
            scene.beginAnimation(blockMesh, 0, 100, true);
          }
        }
      }
    },
  });
}
