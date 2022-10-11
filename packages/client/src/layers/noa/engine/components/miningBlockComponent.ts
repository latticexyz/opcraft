import * as BABYLON from "@babylonjs/core";
import { Engine } from "noa-engine";
import * as glvec3 from "gl-vec3";
import { NetworkLayer } from "../../../network";
import { VoxelCoord } from "@latticexyz/utils";
import { MINING_DURATION, Textures } from "../../constants";

export interface MiningBlockComponent {
  breakingBlockMeshes: BABYLON.Mesh[];
  breakingBlockMaterial: BABYLON.Material;
  active: boolean;
  block: VoxelCoord;
  startTimestamp: number;
  progress: number;
  duration: number;
  __id: number;
}

export const MINING_BLOCK_COMPONENT = "MINING_BLOCK_COMPONENT";

const NORMALS = [
  [0, 0, 1],
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, -1],
  [0, -1, 0],
  [-1, 0, 0],
];

const PARTICLE_SIZE = 0.1;
const NUMBER_OF_PARTICLES = 10;
const PARTICLES_GRAVITY = -0.01;
const PARTICLES_LIFETIME = 100;
const PARTICLE_TEXTURE = Textures.Stone;

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
  const scene = noa.rendering.getScene();
  const TEXTURES = BREAKING.map((textureUrl) => {
    const texture = new BABYLON.Texture(textureUrl, scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
    texture.hasAlpha = true;
    return texture;
  });
  const particleMaterial = new BABYLON.StandardMaterial("particle", scene);
  const particleTexture = new BABYLON.Texture(
    PARTICLE_TEXTURE,
    scene,
    true,
    true,
    BABYLON.Texture.NEAREST_SAMPLINGMODE
  );
  particleMaterial.diffuseTexture = particleTexture;
  particleMaterial.freeze();

  const faceUV = new Array(6);

  for (let i = 0; i < 6; i++) {
    faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0);
  }

  const options = {
    size: PARTICLE_SIZE,
    faceUV: faceUV,
  };
  const particleModel = BABYLON.MeshBuilder.CreateBox("box", options, scene);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: MINING_BLOCK_COMPONENT,
    state: {
      breakingBlockMeshes: [],
      active: false,
      block: { x: 0, y: 0, z: 0 },
      startTimestamp: 0,
      duration: MINING_DURATION,
    },
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
      state.duration = MINING_DURATION;
    },
    system: function (dt: number, states: MiningBlockComponent[]) {
      for (let i = 0; i < states.length; i++) {
        const { breakingBlockMeshes, breakingBlockMaterial, block, active, startTimestamp, duration } = states[i];
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
          const progress = Math.min(Date.now() - startTimestamp, duration) / duration;
          states[i].progress = progress;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          breakingBlockMaterial.diffuseTexture =
            TEXTURES[Math.min(Math.floor(progress * (TEXTURES.length + 1)), TEXTURES.length - 1)];
          if (progress > 0.99) {
            states[i].active = false;
            networkLayer.api.mine(block);
            createExplosion(noa, block, particleModel, particleMaterial);
          }
        } else if (breakingBlockMeshes[0].isEnabled()) {
          for (const breakingBlockMesh of breakingBlockMeshes) {
            breakingBlockMesh.setEnabled(false);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            breakingBlockMaterial.diffuseTexture = TEXTURES[0];
          }
          states[i].duration = MINING_DURATION;
        }
      }
    },
  });
}

function createExplosion(
  noa: Engine,
  block: VoxelCoord,
  particleModel: BABYLON.Mesh,
  particleMaterial: BABYLON.Material
) {
  const sps = new BABYLON.SolidParticleSystem("sps", noa.rendering.getScene());
  sps.addShape(particleModel, NUMBER_OF_PARTICLES);
  const s = sps.buildMesh();
  s.material = particleMaterial;
  for (let i = 0; i < NUMBER_OF_PARTICLES; i++) {
    sps.particles[i].position.x = 0;
    sps.particles[i].position.y = 0;
    sps.particles[i].position.z = 0;

    sps.particles[i].velocity.x = 0.1 * (Math.random() - 0.5);
    sps.particles[i].velocity.y = 0.2 * Math.random();
    sps.particles[i].velocity.z = 0.1 * (Math.random() - 0.5);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    sps.particles[i].rand = 1 / (1 + Math.random()) / 10;
  }

  sps.updateParticle = function (p) {
    p.velocity.y += PARTICLES_GRAVITY;
    p.position.x += p.velocity.x;
    p.position.y += p.velocity.y;
    p.position.z += p.velocity.z;
    let random = 0;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    random = p.rand;
    // rotate
    p.rotation.x += p.velocity.z * random;
    p.rotation.y += p.velocity.x * random;
    p.rotation.z += p.velocity.y * random;

    return p;
  };

  // Init sps
  sps.setParticles(); // set them
  sps.refreshVisibleSize(); // compute the bounding box
  sps.computeParticleColor = false; // the colors won't change
  sps.computeParticleTexture = false; // nor the texture now
  let count = 0;
  const update = () => {
    sps.setParticles();
    count++;
    if (count > PARTICLES_LIFETIME) {
      sps.dispose();
      noa.off("beforeRender", update);
    }
  };
  noa.on("beforeRender", update);

  sps.afterUpdateParticles = function () {
    this.refreshVisibleSize();
  };

  noa.rendering.addMeshToScene(s, false);
  const local: number[] = [];
  const [x, y, z] = noa.globalToLocal([block.x, block.y + 0.5, block.z], [0, 0, 0], local);
  s.position.copyFromFloats(x + 0.5, y, z + 0.5);
}
