import * as BABYLON from "@babylonjs/core";
import { Texture, Vector4 } from "@babylonjs/core";
import { Engine } from "noa-engine";
import { BlockTypeKey } from "../../network/constants";
import { UVWraps } from "../constants";

export function setupHand(noa: Engine) {
  const scene = noa.rendering.getScene();
  const core = BABYLON.MeshBuilder.CreateBox("core", { size: 1 }, scene);
  core.visibility = 0;
  const handMaterial = noa.rendering.makeStandardMaterial("handMaterial");
  handMaterial.diffuseTexture = new Texture(
    "./assets/skins/steve.png",
    scene,
    true,
    true,
    Texture.NEAREST_SAMPLINGMODE
  );
  handMaterial.diffuseTexture!.hasAlpha = true;
  const handFaceUV = new Array(6);
  // from the model.json -> right hand
  const handTextureSize = [64, 64];
  const handSize = [4, 12, 4];
  const handScale = 0.07;
  const handOffset = [40, 16];
  handFaceUV[0] = new Vector4(
    (handOffset[0] + handSize[2]) / handTextureSize[0],
    (handTextureSize[1] - handSize[1] - handSize[2] - handOffset[1]) / handTextureSize[1],
    (handSize[2] + handSize[0] + handOffset[0]) / handTextureSize[0],
    (handTextureSize[1] - handSize[2] - handOffset[1]) / handTextureSize[1]
  );
  handFaceUV[1] = new Vector4(
    (handOffset[0] + handSize[2] * 2 + handSize[0]) / handTextureSize[0],
    (handTextureSize[1] - handSize[1] - handSize[2] - handOffset[1]) / handTextureSize[1],
    (handSize[2] * 2 + handSize[0] * 2 + handOffset[0]) / handTextureSize[0],
    (handTextureSize[1] - handSize[2] - handOffset[1]) / handTextureSize[1]
  );
  handFaceUV[2] = new Vector4(
    handOffset[0] / handTextureSize[0],
    (handTextureSize[1] - handSize[1] - handSize[2] - handOffset[1]) / handTextureSize[1],
    (handOffset[0] + handSize[2]) / handTextureSize[0],
    (handTextureSize[1] - handSize[2] - handOffset[1]) / handTextureSize[1]
  );
  handFaceUV[3] = new Vector4(
    (handOffset[0] + handSize[2] + handSize[0]) / handTextureSize[0],
    (handTextureSize[1] - handSize[1] - handSize[2] - handOffset[1]) / handTextureSize[1],
    (handSize[2] + handSize[0] * 2 + handOffset[0]) / handTextureSize[0],
    (handTextureSize[1] - handSize[2] - handOffset[1]) / handTextureSize[1]
  );
  handFaceUV[4] = new Vector4(
    (handSize[0] + handSize[2] + handOffset[0]) / handTextureSize[0],
    (handTextureSize[1] - handSize[2] - handOffset[1]) / handTextureSize[1],
    (handOffset[0] + handSize[2]) / handTextureSize[0],
    (handTextureSize[1] - handOffset[1]) / handTextureSize[1]
  );
  handFaceUV[5] = new Vector4(
    (handSize[0] * 2 + handSize[2] + handOffset[0]) / handTextureSize[0],
    (handTextureSize[1] - handSize[2] - handOffset[1]) / handTextureSize[1],
    (handOffset[0] + handSize[2] + handSize[0]) / handTextureSize[0],
    (handTextureSize[1] - handOffset[1]) / handTextureSize[1]
  );

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
  const blockFaceUV = new Array(6);
  const blockTextureSize = [BLOCK_SIZE * 4, BLOCK_SIZE * 2];
  const blockSize = [BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE];
  const blockScale = 0.07;
  const blockOffset = [0, 0];

  blockFaceUV[0] = new Vector4(
    (blockOffset[0] + blockSize[2]) / blockTextureSize[0],
    (blockTextureSize[1] - blockSize[1] - blockSize[2] - blockOffset[1]) / blockTextureSize[1],
    (blockSize[2] + blockSize[0] + blockOffset[0]) / blockTextureSize[0],
    (blockTextureSize[1] - blockSize[2] - blockOffset[1]) / blockTextureSize[1]
  );
  blockFaceUV[1] = new Vector4(
    (blockOffset[0] + blockSize[2] * 2 + blockSize[0]) / blockTextureSize[0],
    (blockTextureSize[1] - blockSize[1] - blockSize[2] - blockOffset[1]) / blockTextureSize[1],
    (blockSize[2] * 2 + blockSize[0] * 2 + blockOffset[0]) / blockTextureSize[0],
    (blockTextureSize[1] - blockSize[2] - blockOffset[1]) / blockTextureSize[1]
  );
  blockFaceUV[2] = new Vector4(
    blockOffset[0] / blockTextureSize[0],
    (blockTextureSize[1] - blockSize[1] - blockSize[2] - blockOffset[1]) / blockTextureSize[1],
    (blockOffset[0] + blockSize[2]) / blockTextureSize[0],
    (blockTextureSize[1] - blockSize[2] - blockOffset[1]) / blockTextureSize[1]
  );
  blockFaceUV[3] = new Vector4(
    (blockOffset[0] + blockSize[2] + blockSize[0]) / blockTextureSize[0],
    (blockTextureSize[1] - blockSize[1] - blockSize[2] - blockOffset[1]) / blockTextureSize[1],
    (blockSize[2] + blockSize[0] * 2 + blockOffset[0]) / blockTextureSize[0],
    (blockTextureSize[1] - blockSize[2] - blockOffset[1]) / blockTextureSize[1]
  );
  blockFaceUV[4] = new Vector4(
    (blockSize[0] + blockSize[2] + blockOffset[0]) / blockTextureSize[0],
    (blockTextureSize[1] - blockSize[2] - blockOffset[1]) / blockTextureSize[1],
    (blockOffset[0] + blockSize[2]) / blockTextureSize[0],
    (blockTextureSize[1] - blockOffset[1]) / blockTextureSize[1]
  );
  blockFaceUV[5] = new Vector4(
    (blockSize[0] * 2 + blockSize[2] + blockOffset[0]) / blockTextureSize[0],
    (blockTextureSize[1] - blockSize[2] - blockOffset[1]) / blockTextureSize[1],
    (blockOffset[0] + blockSize[2] + blockSize[0]) / blockTextureSize[0],
    (blockTextureSize[1] - blockOffset[1]) / blockTextureSize[1]
  );

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
  block.rotation.x = -0.1;
  block.rotation.y = -0.8;
  block.rotation.z = 0.3;

  const animationBoxHand = new BABYLON.Animation(
    "movement",
    "position.y",
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  const animationBoxBlock = new BABYLON.Animation(
    "movement",
    "position.y",
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  const Y_HAND = -0.6;
  const Y_BLOCK = -0.6;
  const ANIMATION_SCALE = 2;

  const keysHand = [];

  keysHand.push({
    frame: 0,
    value: Y_HAND + 0.08 * ANIMATION_SCALE,
  });
  keysHand.push({
    frame: 20,
    value: Y_HAND + 0.085 * ANIMATION_SCALE,
  });
  keysHand.push({
    frame: 40,
    value: Y_HAND + 0.08 * ANIMATION_SCALE,
  });
  keysHand.push({
    frame: 60,
    value: Y_HAND + 0.075 * ANIMATION_SCALE,
  });
  keysHand.push({
    frame: 80,
    value: Y_HAND + 0.08 * ANIMATION_SCALE,
  });

  const keysBlock = [];

  keysBlock.push({
    frame: 0,
    value: Y_BLOCK + 0.08 * ANIMATION_SCALE,
  });
  keysBlock.push({
    frame: 20,
    value: Y_BLOCK + 0.085 * ANIMATION_SCALE,
  });
  keysBlock.push({
    frame: 40,
    value: Y_BLOCK + 0.08 * ANIMATION_SCALE,
  });
  keysBlock.push({
    frame: 60,
    value: Y_BLOCK + 0.075 * ANIMATION_SCALE,
  });
  keysBlock.push({
    frame: 80,
    value: Y_BLOCK + 0.08 * ANIMATION_SCALE,
  });

  animationBoxHand.setKeys(keysHand);
  animationBoxBlock.setKeys(keysBlock);
  hand.animations.push(animationBoxHand);
  block.animations.push(animationBoxBlock);
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
  hand.position.set(0.4, Y_HAND, 1.1);
  block.setParent(mesh);
  block.position.set(0.8, Y_BLOCK, 1.2);
  noa.entities.addComponentAgain(noa.playerEntity, "hand", {
    handMesh: hand,
    blockMesh: block,
    blockMaterials,
  });
}
