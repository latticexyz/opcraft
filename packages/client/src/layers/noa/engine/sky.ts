import { Color3, MeshBuilder, Scene, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import type { Engine } from "noa-engine";
/*
 * Setups clouds in a hacky way
 */
const CLOUD_HEIGHT = 120.5;
const SKY_HEIGHT = 20;

export function setupClouds(noa: Engine) {
  const scene = noa.rendering.getScene();
  const cloudMesh = MeshBuilder.CreatePlane(
    "cloudMesh",
    {
      height: 1.5e3,
      width: 1.5e3,
    },
    scene
  );
  cloudMesh.applyFog = false;

  const cloudMat = new StandardMaterial("cloud", scene);
  const cloudTexture = new Texture(
    "./assets/textures/environment/clouds.png",
    scene,
    true,
    true,
    Texture.NEAREST_SAMPLINGMODE
  );
  cloudTexture.hasAlpha = true;
  cloudTexture.vScale = 0.75;
  cloudTexture.uScale = 0.75;

  cloudMat.diffuseTexture = cloudTexture;
  cloudMat.opacityTexture = cloudTexture;
  cloudMat.backFaceCulling = false;
  cloudMat.emissiveColor = new Color3(1, 1, 1);

  cloudMesh.rotation.x = -Math.PI / 2;
  cloudMesh.material = cloudMat;

  noa.rendering.addMeshToScene(cloudMesh, false);

  let pos = [...noa.camera.getPosition()];

  const update = () => {
    cloudTexture.vOffset += 0.00001 + (pos[2] - noa.camera.getPosition()[2]) / 10000;
    cloudTexture.uOffset -= (pos[0] - noa.camera.getPosition()[0]) / 10000;
    pos = [...noa.camera.getPosition()];
    const local: number[] = [];
    const [playerX, _, playerZ] = noa.ents.getPositionData(noa.playerEntity)!.position!;
    const [__, y] = noa.globalToLocal([playerX, CLOUD_HEIGHT, playerZ], [0, 0, 0], local);
    const [x, ___, z] = noa.ents.getPositionData(noa.playerEntity)!._renderPosition!;
    cloudMesh.position.copyFromFloats(x, y, z);
  };

  noa.on("beforeRender", update);

  cloudMesh.onDisposeObservable.add(() => {
    noa.off("beforeRender", update);
  });
}

/*
 * Setups sky color
 */

export function setupSky(noa: Engine) {
  const scene: Scene = noa.rendering.getScene();
  const skyMesh = MeshBuilder.CreatePlane(
    "skyMesh",
    {
      height: 1.2e4,
      width: 1.2e4,
    },
    scene
  );

  const skyMat = new StandardMaterial("sky", scene);
  skyMat.backFaceCulling = false;
  skyMat.emissiveColor = new Color3(0.2, 0.3, 0.7);
  skyMat.diffuseColor = skyMat.emissiveColor;

  skyMesh.renderingGroupId = -1;
  skyMesh.material = skyMat;
  skyMesh.applyFog = true;

  skyMesh.rotation.x = -Math.PI / 2;

  noa.rendering.addMeshToScene(skyMesh, false);

  const update = () => {
    const local: number[] = [];
    const [playerX, playerY, playerZ] = noa.ents.getPositionData(noa.playerEntity)!.position!;
    const [x, y, z] = noa.globalToLocal([playerX, playerY, playerZ], [0, 0, 0], local);
    skyMesh.position.copyFromFloats(x, y + SKY_HEIGHT, z);
  };

  noa.on("beforeRender", update);

  skyMesh.onDisposeObservable.add(() => {
    noa.off("beforeRender", update);
  });
}
