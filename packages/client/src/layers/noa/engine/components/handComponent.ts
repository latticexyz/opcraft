import * as BABYLON from "@babylonjs/core";
import { Engine } from "noa-engine";
import { getComponentValue, HasValue, runQuery } from "@latticexyz/recs";
import { RECS } from "../../types";
import { NetworkLayer } from "../../../network";
import { INDEX_TO_BLOCK } from "../../../react/components/ActionBar";
import { Material } from "@babylonjs/core";
import { BlockIdToKey, BlockTypeKey } from "../../../network/constants";

interface State {
  handMesh: BABYLON.Mesh;
  blockMesh: BABYLON.Mesh;
  blockMaterials: { [key in BlockTypeKey]?: Material };
  __id: number;
}

export function registerHandComponent(noa: Engine, recs: RECS, networkLayer: NetworkLayer) {
  const { SelectedSlot, SingletonEntity } = recs;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: "hand",
    state: { handMesh: null, blockMesh: null, blockMaterial: null },
    system: function (dt: number, states: State[]) {
      for (let i = 0; i < states.length; i++) {
        const { handMesh, blockMesh, blockMaterials } = states[i];
        const id = states[i].__id;
        if (id === noa.playerEntity) {
          // NOTE: for now just animate / change the material of the player hand
          const selectedSlot = getComponentValue(SelectedSlot, SingletonEntity)?.value ?? 1;
          const matchingBlocks = runQuery([
            HasValue(recs.OwnedBy, { value: networkLayer.network.connectedAddress.get() }),
            HasValue(recs.Item, { value: INDEX_TO_BLOCK[selectedSlot] }),
          ]);
          const amount = matchingBlocks.size;
          const blockTypeKey = BlockIdToKey[INDEX_TO_BLOCK[selectedSlot]];
          if (amount > 0 && blockMaterials[blockTypeKey] !== undefined) {
            blockMesh.material = blockMaterials[blockTypeKey]!;
            handMesh.visibility = 0;
            blockMesh.visibility = 1;
          } else {
            handMesh.visibility = 1;
            blockMesh.visibility = 0;
          }
        }
      }
    },
  });
}
