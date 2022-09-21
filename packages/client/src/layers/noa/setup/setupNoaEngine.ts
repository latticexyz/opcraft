import { Engine } from "noa-engine";
// add a mesh to represent the player, and scale it, etc.
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import * as BABYLON from "@babylonjs/core";
import { VoxelCoord } from "@latticexyz/utils";
import { Blocks, MaterialType, Textures } from "../constants";
import { BlockType, BlockTypeIndex } from "../../network";
import { EntityID } from "@latticexyz/recs";

export interface API {
  getTerrainBlockAtPosition: (coord: VoxelCoord) => EntityID;
  getECSBlockAtPosition: (coord: VoxelCoord) => EntityID | undefined;
}

export function setupNoaEngine(api: API) {
  const opts = {
    debug: true,
    showFPS: true,
    inverseY: false,
    inverseX: false,
    chunkAddDistance: [20, 3],
    // 32 is pretty far, but it doesn't increase the memory usage much.
    chunkRemoveDistance: [20, 15],
    playerStart: [-1543, 13, -826],
    blockTestDistance: 7,
    texturePath: "",
    playerHeight: 1.85,
    playerWidth: 0.6,
    playerAutoStep: 1,
    clearColor: [0.8, 0.9, 1],
    ambientColor: [1, 1, 1],
    lightDiffuse: [1, 1, 1],
    lightSpecular: [1, 1, 1],
    groundLightColor: [1, 1, 1],
    useAO: true,
    AOmultipliers: [0.93, 0.8, 0.5],
    reverseAOmultiplier: 1.0,
    preserveDrawingBuffer: true,
  };

  const noa = new Engine(opts);
  // Note: this is the amount of time, per tick, spent requesting chunks from userland and meshing them
  // IT DOES NOT INCLUDE TIME SPENT BY THE CLIENT GENEERATING THE CHUNKS
  // On lower end device we should bring this down to 9 or 11
  noa.world.maxProcessingPerTick = 20;
  noa.world.maxProcessingPerRender = 15;
  // Register materials
  for (const [key, textureUrl] of Object.entries(Textures)) {
    noa.registry.registerMaterial(key, undefined, textureUrl);
  }
  // override the two water materials
  noa.registry.registerMaterial(MaterialType.TransparentWater, [0.5, 0.5, 0.8, 0.7], undefined, true);
  noa.registry.registerMaterial(MaterialType.Water, [1, 1, 1, 0.5], "./assets/blocks/10-Water.png", true);

  // Register blocks
  for (const [key, block] of Object.entries(Blocks)) {
    const index = BlockTypeIndex[BlockType[key as keyof typeof BlockType]];
    if (!block) continue;

    noa.registry.registerBlock(index, block);
  }

  function setBlock(coord: VoxelCoord | number[], block: EntityID) {
    const index = BlockTypeIndex[block];
    if ("length" in coord) {
      noa.setBlock(index, coord[0], coord[1], coord[2]);
    } else {
      noa.setBlock(index, coord.x, coord.y, coord.z);
    }
  }

  noa.world.on("worldDataNeeded", function (id, data, x, y, z) {
    // `id` - a unique string id for the chunk
    // `data` - an `ndarray` of voxel ID data (see: https://github.com/scijs/ndarray)
    // `x, y, z` - world coords of the corner of the chunk
    for (let i = 0; i < data.shape[0]; i++) {
      for (let j = 0; j < data.shape[1]; j++) {
        for (let k = 0; k < data.shape[2]; k++) {
          const ecsBlockType = BlockTypeIndex[api.getECSBlockAtPosition({ x: x + i, y: y + j, z: z + k }) as string];
          if (ecsBlockType) {
            data.set(i, j, k, ecsBlockType);
          } else {
            const blockType = BlockTypeIndex[api.getTerrainBlockAtPosition({ x: x + i, y: y + j, z: z + k }) as string];
            data.set(i, j, k, blockType);
          }
        }
      }
    }
    noa.world.setChunkData(id, data, undefined);
  });

  // each tick, consume any scroll events and use them to zoom camera
  noa.on("tick", function () {
    const scroll = noa.inputs.state.scrolly;
    if (scroll !== 0) {
      noa.camera.zoomDistance += scroll > 0 ? 1 : -1;
      if (noa.camera.zoomDistance < 0) noa.camera.zoomDistance = 0;
      if (noa.camera.zoomDistance > 10) noa.camera.zoomDistance = 10;
    }
  });

  const scene = noa.rendering.getScene();
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  // scene.fogDensity = 0.003;
  scene.fogDensity = 0.0006;
  scene.fogColor = new BABYLON.Color3(0.8, 0.9, 1);

  // Register sounds
  new BABYLON.Sound("theme", "/audio/OP_World_Theme_Mix_1.mp3", null, null, {
    loop: true,
    autoplay: true,
  });
  return { noa, setBlock };
}
