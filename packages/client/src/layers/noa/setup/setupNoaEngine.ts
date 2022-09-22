import { Engine } from "noa-engine";
// add a mesh to represent the player, and scale it, etc.
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import * as BABYLON from "@babylonjs/core";
import { VoxelCoord } from "@latticexyz/utils";
import { Blocks, Textures } from "../constants";
import { BlockType, BlockTypeIndex } from "../../network";
import { EntityID } from "@latticexyz/recs";
import { API, NoaBlockType, RECS } from "../types";
import { createPlantMesh } from "./utils";
import { BlockIndexToKey, BlockTypeKey } from "../../network/constants";

export function setupNoaEngine(api: API, recs: RECS) {
  const opts = {
    debug: true,
    showFPS: true,
    inverseY: false,
    inverseX: false,
    chunkAddDistance: [17, 3],
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
  const scene = noa.rendering.getScene();
  // Note: this is the amount of time, per tick, spent requesting chunks from userland and meshing them
  // IT DOES NOT INCLUDE TIME SPENT BY THE CLIENT GENEERATING THE CHUNKS
  // On lower end device we should bring this down to 9 or 11
  noa.world.maxProcessingPerTick = 17;
  noa.world.maxProcessingPerRender = 12;
  // Register simple materials
  const textures = Object.values(Blocks).reduce<string[]>((materials, block) => {
    if (!block || !block.material) return materials;
    const blockMaterials = (Array.isArray(block.material) ? block.material : [block.material]) as string[];
    if (blockMaterials) materials.push(...blockMaterials);
    return materials;
  }, []);

  for (const texture of textures) {
    noa.registry.registerMaterial(texture, undefined, texture);
  }

  // override the two water materials
  noa.registry.registerMaterial(Textures.TransparentWater, [0.5, 0.5, 0.8, 0.7], undefined, true);
  noa.registry.registerMaterial(Textures.Water, [1, 1, 1, 0.5], "./assets/blocks/10-Water.png", true);

  // Register blocks

  for (const [key, block] of Object.entries(Blocks)) {
    const index = BlockTypeIndex[BlockType[key as BlockTypeKey]];
    const augmentedBlock = { ...block };
    if (!block) continue;

    // Register mesh for mesh blocks
    if (block.type === NoaBlockType.MESH) {
      const texture = Array.isArray(block.material) ? block.material[0] : block.material;
      if (texture === null) {
        throw new Error("Can't create a plant block without a material");
      }
      const mesh = createPlantMesh(noa, scene, texture, key, augmentedBlock.frames);
      augmentedBlock.blockMesh = mesh;
      delete augmentedBlock.material;
    }

    noa.registry.registerBlock(index, augmentedBlock);
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
  // DEV: uncomment to debug models
  // each tick, consume any scroll events and use them to zoom camera
  // noa.on("tick", function () {
  //   const scroll = noa.inputs.state.scrolly;
  //   if (scroll !== 0) {
  //     noa.camera.zoomDistance += scroll > 0 ? 1 : -1;
  //     if (noa.camera.zoomDistance < 0) noa.camera.zoomDistance = 0;
  //     if (noa.camera.zoomDistance > 10) noa.camera.zoomDistance = 10;
  //   }
  // });

  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  // scene.fogDensity = 0.003;
  scene.fogDensity = 0.0006;
  scene.fogColor = new BABYLON.Color3(0.8, 0.9, 1);

  // Register sounds
  new BABYLON.Sound("theme", "/audio/OP_World_Theme_Mix_1.mp3", null, null, {
    loop: true,
    autoplay: true,
  });

  // Change block targeting mechanism
  noa.blockTargetIdCheck = function (index: number) {
    const key = BlockIndexToKey[index];
    return key != null && key != "Air" && !Blocks[key]?.fluid;
  };
  return { noa, setBlock };
}
