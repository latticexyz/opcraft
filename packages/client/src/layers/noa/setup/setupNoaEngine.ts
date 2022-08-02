import { Engine } from "noa-engine";
// add a mesh to represent the player, and scale it, etc.
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import { VoxelCoord } from "@latticexyz/utils";
import * as vec3 from "gl-vec3";
import { Blocks, Textures } from "../constants";
import { BlockType } from "../../network";
import { applyModel } from "../engine/model";
import { Color3 } from "@babylonjs/core";

export function setupNoaEngine(getVoxel: (coord: VoxelCoord) => BlockType) {
  const opts = {
    showFPS: false,
    inverseY: false,
    inverseX: false,
    chunkAddDistance: [5, 5],
    chunkRemoveDistance: [5, 5],
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
    gravity: [0, -14, 0],
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

  const scene = noa.rendering.getScene();

  scene.fogMode = 3;
  scene.fogStart = 500;
  scene.fogEnd = 4000;
  scene.fogDensity = 0.000001;
  scene.fogColor = new Color3(...[0.8, 0.9, 1]);
  applyModel(
    noa,
    noa.playerEntity,
    noa.playerEntity.toString(),
    "./assets/models/player.json",
    "./assets/skins/steve.png",
    0,
    true,
    "Steve",
    [1, 1, 1]
  );
  const entityEvent = async function () {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const playerModel = noa.ents.getState(noa.playerEntity, "model");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const playerPos = noa.ents.getState(noa.playerEntity, "position");

    if (playerModel != undefined) {
      const value = noa.camera.zoomDistance != 0;
      playerModel.main.visibility = value;
      const children = playerModel.main.getChildMeshes(false);

      let i;
      for (i = 0; i < children.length; i++) {
        children[i].visibility = value;
      }

      if (value) {
        updateAnimationOfModel(playerModel, playerPos, noa.camera.getTargetPosition(), playerModel.main);
        playerModel.main.rotation.y = noa.camera.heading;
        playerModel.models["els/player.json.part-head"].rotation.x = noa.camera.pitch;
      }
    }

    // Object.values(entityList).forEach(async function (id: number) {
    //   const pos = noa.ents.getState(id, "position");
    //   const newPos = pos.newPosition;
    //   const mainMesh = noa.ents.getState(id, "mesh");
    //   const model = noa.ents.getState(id, "model");
    //   if (mainMesh != undefined && newPos != undefined && pos.position != undefined) {
    //     let move = vec3.create();
    //     vec3.lerp(move, pos.position, newPos, 12 / engine.getFps());
    //     noa.ents.setPosition(id, move[0], move[1], move[2]);
    //     updateAnimationOfModel(model, pos, newPos, mainMesh.mesh);
    //   }
    // });
  };

  function updateAnimationOfModel(model: any, pos: any, newPos: any, mainMesh: any) {
    const posx = pos.position;

    const move = vec3.create();
    vec3.lerp(move, posx, newPos, 1);
    const rot = pos.rotation ? pos.rotation : 0;
    const pitch = pos.pitch ? pos.pitch : 0;
    const pos2da = [newPos[0], 0, newPos[2]];
    const pos2db = [posx[0], 0, posx[2]];

    if (model.x == undefined) {
      model.x = 0;
      model.y = 0;
      model.z = false;
    }

    const sin = Math.sin(model.x);
    if (vec3.dist(pos2da, pos2db) > 0.05) {
      model.y = vec3.dist(pos2da, pos2db) / 5;
      model.x = model.x + model.y;
      if (Math.abs(sin) > 0.95) model.z = true;
      else if (Math.abs(sin) < 0.05) model.z = false;
    } else {
      const sin2 = parseFloat(sin.toFixed(1));
      if (sin2 != 0 && !model.z) model.x = model.x - 0.05;
      if (sin2 != 0 && model.z) model.x = model.x + 0.05;
    }
    model.models["els/player.json.part-left_arm"].rotation.x = -sin;
    model.models["els/player.json.part-right_arm"].rotation.x = sin;
    model.models["els/player.json.part-left_leg"].rotation.x = -sin;
    model.models["els/player.json.part-right_leg"].rotation.x = sin;

    if (!mainMesh.rotation.y) mainMesh.rotation.y = 0;

    const oldRot = mainMesh.rotation.y;

    if (rot / 2 - oldRot > 5) mainMesh.rotation.y = rot / 2;
    else mainMesh.rotation.y = (rot / 2 + oldRot) / 2;

    model.models["els/player.json.part-head"].rotation.x = pitch / 2;

    if (model.nametag != undefined) {
      model.nametag.rotation.y = noa.camera.heading - mainMesh.rotation.y;
      model.nametag.rotation.x = noa.camera.pitch;
    }
  }

  noa.on("beforeRender", entityEvent);
  return { noa, setBlock };
}
