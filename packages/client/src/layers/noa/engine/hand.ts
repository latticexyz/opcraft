import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Texture, Vector3, Vector4 } from "@babylonjs/core";
import { Engine } from "noa-engine";

export function setupHand(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.entities.removeComponent(noa.playerEntity, noa.entities.names.fadeOnZoom);
  const toMonkeyPatch = (dt: any, states: any) => {
    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const id = state.__id;
      const rpos = noa.ents.getPositionData(id)!._renderPosition!;
      const yaw = noa.camera.heading;
      const pitch = noa.camera.pitch;
      state.mesh.position.copyFromFloats(
        rpos[0] + state.offset[0],
        rpos[1] + state.offset[1],
        rpos[2] + state.offset[2]
      );
      state.mesh.rotation.copyFromFloats(pitch, yaw, 0);
    }
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.entities.components.mesh.renderSystem = toMonkeyPatch;
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
  //   hand.rotation.y = -Math.PI / 8;
  hand.rotation.x = -Math.PI / 2;

  const animationBox = new BABYLON.Animation(
    "movement",
    "position.y",
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  const Y = -0.6;
  const ANIMATION_SCALE = 2;

  const keys = [];
  keys.push({
    frame: 0,
    value: Y + 0.08 * ANIMATION_SCALE,
  });

  keys.push({
    frame: 20,
    value: Y + 0.085 * ANIMATION_SCALE,
  });

  keys.push({
    frame: 40,
    value: Y + 0.08 * ANIMATION_SCALE,
  });

  keys.push({
    frame: 60,
    value: Y + 0.075 * ANIMATION_SCALE,
  });

  keys.push({
    frame: 80,
    value: Y + 0.08 * ANIMATION_SCALE,
  });

  animationBox.setKeys(keys);
  hand.animations.push(animationBox);
  scene.beginAnimation(hand, 0, 100, true);
  noa.rendering.addMeshToScene(core);
  noa.rendering.addMeshToScene(hand);
  const eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity)!.height;
  noa.entities.addComponentAgain(noa.playerEntity, "mesh", {
    mesh: core,
    offset: [0, eyeOffset, 0],
  });
  const { mesh } = noa.entities.getMeshData(noa.playerEntity);
  hand.setParent(mesh);
  hand.position.set(0.4, Y, 1.1);
}
