import { Engine } from "noa-engine";
// add a mesh to represent the player, and scale it, etc.
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import { VoxelCoord } from "@latticexyz/utils";
import { Blocks, BlockType, Textures } from "../constants";

export function setupNoaEngine(getVoxel: (coord: VoxelCoord) => BlockType) {
  const opts = {
    debug: true,
    showFPS: true,
    chunkSize: 32,
    chunkAddDistance: 2.5,
    chunkRemoveDistance: 3.5,
  };

  const noa = new Engine(opts);

  // Register materials
  for (const [key, textureUrl] of Object.entries(Textures)) {
    noa.registry.registerMaterial(key, undefined, textureUrl);
  }

  // Register blocks
  for (const [id, block] of Object.entries(Blocks)) {
    if (!block) continue;

    noa.registry.registerBlock(id, block);
  }

  function setBlock(coord: VoxelCoord | number[], block: BlockType) {
    if ("length" in coord) {
      noa.setBlock(block, coord[0], coord[1], coord[2]);
    } else {
      noa.setBlock(block, coord.x, coord.y, coord.z);
    }
  }

  noa.world.on("worldDataNeeded", function (id, data, x, y, z) {
    // `id` - a unique string id for the chunk
    // `data` - an `ndarray` of voxel ID data (see: https://github.com/scijs/ndarray)
    // `x, y, z` - world coords of the corner of the chunk
    for (let i = 0; i < data.shape[0]; i++) {
      for (let j = 0; j < data.shape[1]; j++) {
        for (let k = 0; k < data.shape[2]; k++) {
          const blockType = getVoxel({ x: x + i, y: y + j, z: z + k });
          data.set(i, j, k, blockType);
        }
      }
    }

    // tell noa the chunk's terrain data is now set
    noa.world.setChunkData(id, data, undefined);
  });

  // each tick, consume any scroll events and use them to zoom camera
  noa.on("tick", function (dt) {
    const scroll = noa.inputs.state.scrolly;
    if (scroll !== 0) {
      noa.camera.zoomDistance += scroll > 0 ? 1 : -1;
      if (noa.camera.zoomDistance < 0) noa.camera.zoomDistance = 0;
      if (noa.camera.zoomDistance > 10) noa.camera.zoomDistance = 10;
    }
  });

  return { noa, setBlock };
}
