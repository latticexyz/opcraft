import { Color3, Matrix, MeshBuilder, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import * as BABYLON from "@babylonjs/core";
import type { Engine } from "noa-engine";
/*
 * Setups clouds in a hacky way
 */
const CYCLE = 5 * 60 * 1000;

/*
 * Setups sun
 */

export function setupSun(noa: Engine, glow: BABYLON.GlowLayer) {
  const scene: Scene = noa.rendering.getScene();
  const marker = MeshBuilder.CreateBox("marker");
  marker.visibility = 0;
  const sun = MeshBuilder.CreatePlane(
    "skyMesh",
    {
      size: 100,
    },
    scene
  );
  const sunMat = new StandardMaterial("sun", scene);
  sunMat.backFaceCulling = false;
  sunMat.emissiveColor = new Color3(1, 1, 1);
  sunMat.diffuseColor = sunMat.emissiveColor;
  sun.renderingGroupId = 0;
  sun.material = sunMat;
  sun.rotation.y = Math.PI / 2;
  sun.applyFog = false;
  sun.setParent(marker);
  sun.position.copyFromFloats(-1000, 0, 0);
  marker.rotation.z = -Math.PI / 4;
  noa.rendering.addMeshToScene(marker, false);
  noa.rendering.addMeshToScene(sun, false);

  glow.addIncludedOnlyMesh(sun);

  let elapsed = Date.now();
  let last = Date.now();
  const update = () => {
    const now = Date.now();
    const dt = now - last;
    last = now;
    elapsed += dt;
    const progress = (elapsed % CYCLE) / CYCLE;
    // sync SUN marker
    const local: number[] = [];
    const [playerX, playerY, playerZ] = noa.ents.getPositionData(noa.playerEntity)!.position!;
    const [x, y, z] = noa.globalToLocal([playerX, playerY, playerZ], [0, 0, 0], local);
    marker.position.copyFromFloats(x, y, z);
    // move sun
    marker.rotation.z = -(Math.PI * 2 * progress);
    const scene = noa.rendering.getScene();
    const gradingLevel = Math.max(0, Math.min(3 * Math.sin(-(Math.PI * 2 * progress)), 1));
    glow.intensity = Math.max(0, Math.min(1 - gradingLevel, 1)) * 0.4;
    scene.imageProcessingConfiguration.colorGradingTexture.level = gradingLevel;
  };

  noa.on("beforeRender", update);

  marker.onDisposeObservable.add(() => {
    noa.off("beforeRender", update);
  });
}
