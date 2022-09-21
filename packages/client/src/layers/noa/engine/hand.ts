import * as BABYLON from "@babylonjs/core";
import { Texture, Vector4 } from "@babylonjs/core";
import { Engine } from "noa-engine";
import { MaterialType, Textures } from "../constants";

export function setupHand(noa: Engine) {
  const scene = noa.rendering.getScene();
  const core = BABYLON.MeshBuilder.CreateBox("core", { size: 1 }, scene);
  core.visibility = 0;
  const handMaterial = noa.rendering.makeStandardMaterial("handMaterial");
  const blockMaterial = noa.rendering.makeStandardMaterial("blockMaterial");
  handMaterial.diffuseTexture = new Texture(
    "./assets/skins/steve.png",
    scene,
    true,
    true,
    Texture.NEAREST_SAMPLINGMODE
  );
  handMaterial.diffuseTexture!.hasAlpha = true;
  // TODO: in order to make it work with blocks that have different faces we need to uv wrap them
  blockMaterial.diffuseTexture = new Texture(
    Textures[MaterialType.Cobblestone],
    scene,
    true,
    true,
    Texture.NEAREST_SAMPLINGMODE
  );
  const faceUV = new Array(6);
  // from the model.json -> right hand
  const txtSize = [64, 64];
  const size = [4, 12, 4];
  const scale = 0.07;
  const off = [40, 16];
  faceUV[0] = new Vector4(
    (off[0] + size[2]) / txtSize[0],
    (txtSize[1] - size[1] - size[2] - off[1]) / txtSize[1],
    (size[2] + size[0] + off[0]) / txtSize[0],
    (txtSize[1] - size[2] - off[1]) / txtSize[1]
  );
  faceUV[1] = new Vector4(
    (off[0] + size[2] * 2 + size[0]) / txtSize[0],
    (txtSize[1] - size[1] - size[2] - off[1]) / txtSize[1],
    (size[2] * 2 + size[0] * 2 + off[0]) / txtSize[0],
    (txtSize[1] - size[2] - off[1]) / txtSize[1]
  );
  faceUV[2] = new Vector4(
    off[0] / txtSize[0],
    (txtSize[1] - size[1] - size[2] - off[1]) / txtSize[1],
    (off[0] + size[2]) / txtSize[0],
    (txtSize[1] - size[2] - off[1]) / txtSize[1]
  );
  faceUV[3] = new Vector4(
    (off[0] + size[2] + size[0]) / txtSize[0],
    (txtSize[1] - size[1] - size[2] - off[1]) / txtSize[1],
    (size[2] + size[0] * 2 + off[0]) / txtSize[0],
    (txtSize[1] - size[2] - off[1]) / txtSize[1]
  );
  faceUV[4] = new Vector4(
    (size[0] + size[2] + off[0]) / txtSize[0],
    (txtSize[1] - size[2] - off[1]) / txtSize[1],
    (off[0] + size[2]) / txtSize[0],
    (txtSize[1] - off[1]) / txtSize[1]
  );
  faceUV[5] = new Vector4(
    (size[0] * 2 + size[2] + off[0]) / txtSize[0],
    (txtSize[1] - size[2] - off[1]) / txtSize[1],
    (off[0] + size[2] + size[0]) / txtSize[0],
    (txtSize[1] - off[1]) / txtSize[1]
  );

  const hand = BABYLON.MeshBuilder.CreateBox(
    "hand",
    {
      height: size[1] * scale,
      width: size[0] * scale,
      depth: size[2] * scale,
      faceUV: faceUV,
      wrap: true,
    },
    scene
  );
  hand.material = handMaterial;
  hand.rotation.x = -Math.PI / 2;

  const block = BABYLON.MeshBuilder.CreateBox(
    "block",
    {
      height: 8 * scale,
      width: 8 * scale,
      depth: 8 * scale,
      //   faceUV: faceUV,
      wrap: true,
    },
    scene
  );
  block.material = blockMaterial;
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
  hand.visibility = 0;
}
