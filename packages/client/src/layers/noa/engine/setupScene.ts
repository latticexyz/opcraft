import * as BABYLON from "@babylonjs/core";
import { Engine } from "noa-engine";
import { CHUNK_RENDER_DISTANCE, CHUNK_SIZE, SKY_COLOR } from "../setup/constants";

export function setupScene(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const camera = noa.rendering._camera;
  const scene = noa.rendering.getScene();
  scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
  scene.fogStart = CHUNK_RENDER_DISTANCE * CHUNK_SIZE;
  scene.fogEnd = CHUNK_RENDER_DISTANCE * CHUNK_SIZE + CHUNK_SIZE * 2;
  scene.fogColor = new BABYLON.Color3(...SKY_COLOR);
  const colorGrading = new BABYLON.Texture("./assets/textures/lut/LUT_Night2.png", scene, true, false);
  colorGrading.level = 0;
  colorGrading.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
  colorGrading.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  scene.imageProcessingConfiguration.colorGradingWithGreenDepth = false;
  scene.imageProcessingConfiguration.colorGradingEnabled = true;
  scene.imageProcessingConfiguration.colorGradingTexture = colorGrading;
  // Color Curves
  const postProcess = new BABYLON.ImageProcessingPostProcess("processing", 1.0, camera);
  const curve = new BABYLON.ColorCurves();
  curve.globalSaturation = 60; // CANDY!
  postProcess.colorCurves = curve;
  postProcess.colorCurvesEnabled = true;
  // Glow
  const glow = new BABYLON.GlowLayer("glow", scene, {
    mainTextureFixedSize: 512,
    blurKernelSize: 128,
  });
  glow.intensity = 0.4;
  return { colorGrading, postProcess, glow };
}
