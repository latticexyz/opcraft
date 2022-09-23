import { Scene } from "@babylonjs/core";
import { Engine } from "noa-engine";
import * as BABYLON from "@babylonjs/core";

export function createMeshBlock(noa: Engine, scene: Scene, texture: string, name: string, frames = 1) {
  const matname = name || "mat";
  const tex = new BABYLON.Texture(texture, scene, true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE);
  tex.hasAlpha = true;
  const mesh = BABYLON.Mesh.CreatePlane("sprite-" + matname, 1, scene);
  const material = noa.rendering.makeStandardMaterial(matname);
  material.backFaceCulling = false;
  material.diffuseTexture = tex;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  material.diffuseTexture.vOffset = 0.99;
  mesh.material = material;
  mesh.rotation.y += 0.81;
  material.diffuseTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  material.diffuseTexture.vScale = 1 / frames;

  material.unfreeze();

  let time = 0;
  const frameTime = 30;
  scene.registerBeforeRender(() => {
    time++;
    const currentFrame = Math.floor(time / frameTime) % frames;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    material.diffuseTexture.vOffset = (1 / frames) * currentFrame;
  });

  const offset = BABYLON.Matrix.Translation(0, 0.5, 0);
  mesh.bakeTransformIntoVertices(offset);
  const clone = mesh.clone();
  clone.rotation.y += 1.62;
  return BABYLON.Mesh.MergeMeshes([mesh, clone], true);
}
