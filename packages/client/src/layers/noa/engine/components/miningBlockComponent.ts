import * as BABYLON from "@babylonjs/core";
import { Engine } from "noa-engine";
import * as glvec3 from "gl-vec3";
import { NetworkLayer } from "../../../network";
import { VoxelCoord } from "@latticexyz/utils";

export interface MiningBlockComponent {
  breakingBlockMeshes: BABYLON.Mesh[];
  breakingBlockMaterial: BABYLON.Material;
  active: boolean;
  block: VoxelCoord;
  startTimestamp: number;
  progress: number;
  __id: number;
}

export const MINING_BLOCK_COMPONENT = "MINING_BLOCK_COMPONENT";

const MINING_DURATION = 1000;

const NORMALS = [
  [0, 0, 1],
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, -1],
  [0, -1, 0],
  [-1, 0, 0],
];

const BREAKING = [
  "./assets/textures/destroy-0.png",
  "./assets/textures/destroy-1.png",
  "./assets/textures/destroy-2.png",
  "./assets/textures/destroy-3.png",
  "./assets/textures/destroy-4.png",
  "./assets/textures/destroy-5.png",
  "./assets/textures/destroy-6.png",
  "./assets/textures/destroy-7.png",
];

export function registerMiningBlockComponent(noa: Engine, networkLayer: NetworkLayer) {
  const TEXTURES = BREAKING.map((textureUrl) => {
    const texture = new BABYLON.Texture(
      textureUrl,
      noa.rendering.getScene(),
      true,
      true,
      BABYLON.Texture.NEAREST_SAMPLINGMODE
    );
    texture.hasAlpha = true;
    return texture;
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: MINING_BLOCK_COMPONENT,
    state: { breakingBlockMeshes: [], active: false, block: { x: 0, y: 0, z: 0 }, startTimestamp: 0 },
    onAdd: (id: number, state: MiningBlockComponent) => {
      const material = noa.rendering.makeStandardMaterial("crack-" + id);
      material.backFaceCulling = false;
      material.unfreeze();
      material.diffuseTexture = TEXTURES[0];
      for (const _ of [0, 1, 2, 3, 4, 5]) {
        const mesh = BABYLON.MeshBuilder.CreatePlane("crack", { size: 1.0 }, noa.rendering._scene);
        mesh.material = material;
        noa.rendering.addMeshToScene(mesh);
        mesh.setEnabled(false);
        state.breakingBlockMeshes.push(mesh);
      }
      state.breakingBlockMaterial = material;
      state.active = false;
      state.startTimestamp = 0;
      state.progress = 0;
    },
    system: function (dt: number, states: MiningBlockComponent[]) {
      for (let i = 0; i < states.length; i++) {
        const { breakingBlockMeshes, breakingBlockMaterial, block, active, startTimestamp } = states[i];
        if (!breakingBlockMeshes.length) {
          return;
        }
        if (active && !breakingBlockMeshes[0].isEnabled()) {
          states[i].startTimestamp = Date.now();
          states[i].progress = 0;
          const localPosition: number[] = [];
          noa.globalToLocal([block.x, block.y, block.z], null, localPosition);
          // set each breakingBlockMesh
          for (const [i, breakingBlockMesh] of breakingBlockMeshes.entries()) {
            const normalVector = [...NORMALS[i]];
            const blockPosition = [...localPosition];
            // offset to avoid z-fighting, bigger when camera is far away
            const dist = glvec3.dist(noa.camera._localGetPosition(), blockPosition);
            const slop = 0.001 + 0.001 * dist;
            for (let i = 0; i < 3; i++) {
              if (normalVector[i] === 0) {
                blockPosition[i] += 0.5;
              } else {
                blockPosition[i] += normalVector[i] > 0 ? 1 + slop : -slop;
              }
            }
            breakingBlockMesh.position.copyFromFloats(blockPosition[0], blockPosition[1], blockPosition[2]);
            breakingBlockMesh.rotation.x = normalVector[1] ? Math.PI / 2 : 0;
            breakingBlockMesh.rotation.y = normalVector[0] ? Math.PI / 2 : 0;
            breakingBlockMesh.setEnabled(true);
          }
        } else if (active) {
          const progress = Math.min(Date.now() - startTimestamp, MINING_DURATION) / MINING_DURATION;
          states[i].progress = progress;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          breakingBlockMaterial.diffuseTexture =
            TEXTURES[Math.min(Math.floor(progress * (TEXTURES.length + 1)), TEXTURES.length - 1)];
          if (progress > 0.99) {
            states[i].active = false;
            networkLayer.api.mine(block);
          }
        } else if (breakingBlockMeshes[0].isEnabled()) {
          for (const breakingBlockMesh of breakingBlockMeshes) {
            breakingBlockMesh.setEnabled(false);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            breakingBlockMaterial.diffuseTexture = TEXTURES[0];
          }
        }
      }
    },
  });
}
