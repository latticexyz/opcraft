import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import type { Engine } from "noa-engine";

export let cloudMesh: Mesh;
export let skyMesh: Mesh;

/*
 * Setups clouds in a hacky way
 */

export function setupClouds(noa: Engine) {
  const scene = noa.rendering.getScene();
  cloudMesh = MeshBuilder.CreatePlane(
    "cloudMesh",
    {
      height: 1.5e3,
      width: 1.5e3,
    },
    scene
  );

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

  cloudMesh.setPositionWithLocalVector(new Vector3(0, 0, 200));

  let pos = [...noa.camera.getPosition()];

  const update = () => {
    const x = noa.ents.getMeshData(noa.playerEntity);
    if (x != undefined) {
      cloudMesh.setParent(x.mesh);
    }

    cloudTexture.vOffset += 0.00001 + (pos[2] - noa.camera.getPosition()[2]) / 10000;
    cloudTexture.uOffset -= (pos[0] - noa.camera.getPosition()[0]) / 10000;
    pos = [...noa.camera.getPosition()];

    cloudMesh.setPositionWithLocalVector(new Vector3(0, 0, 250 - noa.camera.getPosition()[1]));
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
  if (skyMesh != null && !skyMesh.isDisposed) {
    skyMesh.dispose();
  }
  skyMesh = MeshBuilder.CreatePlane(
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

  skyMesh.infiniteDistance = true;
  skyMesh.renderingGroupId;
  skyMesh.material = skyMat;

  skyMesh.rotation.x = -Math.PI / 2;

  noa.rendering.addMeshToScene(skyMesh, false);

  skyMesh.setPositionWithLocalVector(new Vector3(0, 0, 500));

  const update = () => {
    skyMesh.setPositionWithLocalVector(new Vector3(0, 0, 500));
  };

  noa.on("beforeRender", update);

  cloudMesh.onDisposeObservable.add(() => {
    noa.off("beforeRender", update);
  });
}
