import * as BABYLON from "@babylonjs/core";
import { Texture, Vector4 } from "@babylonjs/core";
import { Engine } from "noa-engine";
import { BlockTypeKey } from "../../network/constants";
import { UVWraps } from "../constants";
import { HAND_COMPONENT } from "./components/handComponent";
export const X_HAND = 0.4;
export const X_BLOCK = 0.7;
export const Y_HAND = -0.6;
export const Y_BLOCK = -0.6;
export const Z_HAND = 1;
export const Z_BLOCK = 1.2;
export const ANIMATION_SCALE_IDLE = 2;
export const ANIMATION_SCALE_MINING = 20;
export const IDLE_ANIMATION_BOX_HAND = createIdleAnimation(Y_HAND);
export const IDLE_ANIMATION_BOX_BLOCK = createIdleAnimation(Y_BLOCK);
export const MINING_ANIMATION_BOX_HAND = createMiningAnimation(Z_HAND);
export const MINING_ANIMATION_BOX_BLOCK = createMiningAnimation(Z_BLOCK);

export function setupHand(noa: Engine) {
  const scene = noa.rendering.getScene();
  const core = BABYLON.MeshBuilder.CreateBox("core", { size: 1 }, scene);
  core.visibility = 0;
  const handMaterial = noa.rendering.makeStandardMaterial("handMaterial");
  handMaterial.diffuseTexture = new Texture(
    "./assets/skins/player1.png",
    scene,
    true,
    true,
    Texture.NEAREST_SAMPLINGMODE
  );
  handMaterial.diffuseTexture!.hasAlpha = true;
  // from the player.json -> right hand
  const handTextureSize = [128, 128];
  const handSize = [8, 24, 8];
  const handScale = 0.035;
  const handOffset = [80, 32];
  const handFaceUV = createFaceUV(handOffset, handSize, handTextureSize);
  const hand = BABYLON.MeshBuilder.CreateBox(
    "hand",
    {
      height: handSize[1] * handScale,
      width: handSize[0] * handScale,
      depth: handSize[2] * handScale,
      faceUV: handFaceUV,
      wrap: true,
    },
    scene
  );
  hand.renderingGroupId = 3;
  hand.material = handMaterial;
  hand.rotation.x = -Math.PI / 2;

  const blockMaterials: { [key in BlockTypeKey]?: BABYLON.Material } = {};
  for (const key of Object.keys(UVWraps) as BlockTypeKey[]) {
    if (UVWraps[key] !== undefined) {
      const blockMaterial = noa.rendering.makeStandardMaterial("blockMaterial-" + key);
      blockMaterial.diffuseTexture = new Texture(UVWraps[key]!, scene, true, true, Texture.NEAREST_SAMPLINGMODE);
      blockMaterials[key as BlockTypeKey] = blockMaterial;
    } else {
      blockMaterials[key as BlockTypeKey] = undefined;
    }
  }
  const BLOCK_SIZE = 16;
  const blockTextureSize = [BLOCK_SIZE * 4, BLOCK_SIZE * 2];
  const blockSize = [BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE];
  const blockScale = 0.07;
  const blockOffset = [0, 0];
  const blockFaceUV = createFaceUV(blockOffset, blockSize, blockTextureSize);

  const block = BABYLON.MeshBuilder.CreateBox(
    "block",
    {
      height: 8 * blockScale,
      width: 8 * blockScale,
      depth: 8 * blockScale,
      faceUV: blockFaceUV,
      wrap: true,
    },
    scene
  );
  block.renderingGroupId = 3;
  block.rotation.x = -0.1;
  block.rotation.y = -0.8;
  block.rotation.z = 0.3;

  hand.animations.push(IDLE_ANIMATION_BOX_HAND);
  block.animations.push(IDLE_ANIMATION_BOX_BLOCK);
  scene.beginAnimation(hand, 0, 100, true);
  scene.beginAnimation(block, 0, 100, true);
  noa.rendering.addMeshToScene(core);
  noa.rendering.addMeshToScene(hand);
  noa.rendering.addMeshToScene(block);
  const eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity)!.height;
  noa.entities.addComponentAgain(noa.playerEntity, "mesh", {
    mesh: core,
    offset: [0, eyeOffset, 0],
  });
  const { mesh } = noa.entities.getMeshData(noa.playerEntity);
  hand.setParent(mesh);
  hand.position.set(X_HAND, Y_HAND, Z_HAND);
  block.setParent(mesh);
  block.position.set(X_BLOCK, Y_BLOCK, Z_BLOCK);
  noa.entities.addComponentAgain(noa.playerEntity, HAND_COMPONENT, {
    handMesh: hand,
    blockMesh: block,
    blockMaterials,
  });
}

function createFaceUV(offset: number[], size: number[], textureSize: number[]): Vector4[] {
  const faceUV = new Array(6);
  faceUV[0] = new Vector4(
    (offset[0] + size[2]) / textureSize[0],
    (textureSize[1] - size[1] - size[2] - offset[1]) / textureSize[1],
    (size[2] + size[0] + offset[0]) / textureSize[0],
    (textureSize[1] - size[2] - offset[1]) / textureSize[1]
  );
  faceUV[1] = new Vector4(
    (offset[0] + size[2] * 2 + size[0]) / textureSize[0],
    (textureSize[1] - size[1] - size[2] - offset[1]) / textureSize[1],
    (size[2] * 2 + size[0] * 2 + offset[0]) / textureSize[0],
    (textureSize[1] - size[2] - offset[1]) / textureSize[1]
  );
  faceUV[2] = new Vector4(
    offset[0] / textureSize[0],
    (textureSize[1] - size[1] - size[2] - offset[1]) / textureSize[1],
    (offset[0] + size[2]) / textureSize[0],
    (textureSize[1] - size[2] - offset[1]) / textureSize[1]
  );
  faceUV[3] = new Vector4(
    (offset[0] + size[2] + size[0]) / textureSize[0],
    (textureSize[1] - size[1] - size[2] - offset[1]) / textureSize[1],
    (size[2] + size[0] * 2 + offset[0]) / textureSize[0],
    (textureSize[1] - size[2] - offset[1]) / textureSize[1]
  );
  faceUV[4] = new Vector4(
    (size[0] + size[2] + offset[0]) / textureSize[0],
    (textureSize[1] - size[2] - offset[1]) / textureSize[1],
    (offset[0] + size[2]) / textureSize[0],
    (textureSize[1] - offset[1]) / textureSize[1]
  );
  faceUV[5] = new Vector4(
    (size[0] * 2 + size[2] + offset[0]) / textureSize[0],
    (textureSize[1] - size[2] - offset[1]) / textureSize[1],
    (offset[0] + size[2] + size[0]) / textureSize[0],
    (textureSize[1] - offset[1]) / textureSize[1]
  );
  return faceUV;
}

function createIdleAnimation(offset: number) {
  const keys = [];
  keys.push({
    frame: 0,
    value: offset + 0.08 * ANIMATION_SCALE_IDLE,
  });
  keys.push({
    frame: 20,
    value: offset + 0.085 * ANIMATION_SCALE_IDLE,
  });
  keys.push({
    frame: 40,
    value: offset + 0.08 * ANIMATION_SCALE_IDLE,
  });
  keys.push({
    frame: 60,
    value: offset + 0.075 * ANIMATION_SCALE_IDLE,
  });
  keys.push({
    frame: 80,
    value: offset + 0.08 * ANIMATION_SCALE_IDLE,
  });
  const animationBox = new BABYLON.Animation(
    "idle",
    "position.y",
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  animationBox.setKeys(keys);
  return animationBox;
}

function createMiningAnimation(offset: number) {
  const keys = [];
  keys.push({
    frame: 0,
    value: offset,
  });
  keys.push({
    frame: 20,
    value: offset + 0.005 * ANIMATION_SCALE_MINING,
  });
  keys.push({
    frame: 40,
    value: offset,
  });
  keys.push({
    frame: 60,
    value: offset - 0.005 * ANIMATION_SCALE_MINING,
  });
  keys.push({
    frame: 80,
    value: offset,
  });
  const animationBox = new BABYLON.Animation(
    "mining",
    "position.z",
    300,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );

  animationBox.setKeys(keys);
  return animationBox;
}
