import {
  AbstractMesh,
  DynamicTexture,
  Matrix,
  Mesh,
  MeshBuilder,
  Plane,
  Texture,
  Vector3,
  Vector4,
} from "@babylonjs/core";
import { Engine } from "noa-engine";

// Note: this code was vendored from https://github.com/VoxelSrv/voxelsrv on commit 6e1c07b
// A rewrite is coming... soon™️

const models: { [key: string]: any } = {};
const templateModels: { [i: string]: Mesh } = {};

/*
 * Setups and applies model to entity
 */

export async function applyModel(noa: Engine, eid: number, model: string, texture: string, name: string) {
  if (models[model] == undefined) {
    fetch(model)
      .then((response) => response.json())
      .then(async (data) => {
        models[model] = data;
        applyModelTo(noa, model, data, texture, name, eid);
      });
  } else {
    applyModelTo(noa, model, models[model], texture, name, eid);
  }
}

async function applyModelTo(noa: Engine, model: string, data: object, texture: string, name: string, eid: number) {
  const builded: any = await buildModel(noa, model, data, texture);

  builded.nametag = addNametag(noa, builded.main, name, noa.ents.getPositionData(eid)!.height);

  noa.ents.addComponentAgain(eid, "model", builded);

  noa.entities.addComponentAgain(eid, "mesh", {
    mesh: builded.main,
    animations: models[model].animations,
  });

  noa.rendering.addMeshToScene(builded.main, false);
}

/*
 * Builds model
 */

async function buildModel(noa: Engine, name: string, model: object, texture: string) {
  const scene = noa.rendering.getScene();
  const meshlist: { main: any; models: { [key: string]: any } } = { main: null, models: {} };

  if (templateModels[name] == undefined) createTemplateModel(noa, name, model);

  const mesh = templateModels[name].clone(name, null, false, false);
  noa.rendering.addMeshToScene(mesh);

  mesh.getChildMeshes().forEach((cmesh: AbstractMesh) => {
    let partName = cmesh.name.substr(12);
    partName = partName.substr(0, partName.length - 9);

    const mat = noa.rendering.makeStandardMaterial("modelmaterial-" + partName);
    cmesh.material = mat;
    mat.diffuseTexture = new Texture(texture, scene, true, true, Texture.NEAREST_SAMPLINGMODE);
    mat.diffuseTexture.hasAlpha = true;
    noa.rendering.addMeshToScene(cmesh);
    meshlist.models[partName] = cmesh;
  });

  meshlist.main = mesh;

  return meshlist;
}

function createTemplateModel(noa: Engine, name: string, model: any) {
  const scene = noa.rendering.getScene();
  const scale = 0.03;
  const txtSize = [model.geometry.texturewidth, model.geometry.textureheight];

  const main = new Mesh("main", scene);

  const modeldata = model.geometry.bones;

  for (let x = 0; x < modeldata.length; x++) {
    const mdata = modeldata[x];

    const box = mdata.cubes;
    const part = new Array(box.length);
    const pivot = mdata.pivot;

    for (let y = 0; y < box.length; y++) {
      let add = 0;
      if (box[y].inflate != undefined) add = box[y].inflate;

      const faceUV = new Array(6);

      const size = box[y].size;
      const pos = box[y].origin;
      const off = box[y].uv;

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

      part[y] = MeshBuilder.CreateBox(
        "part-" + mdata.name + "-" + y,
        {
          height: (size[1] + add) * scale,
          width: (size[0] + add) * scale,
          depth: (size[2] + add) * scale,
          faceUV: faceUV,
          wrap: true,
        },
        scene
      );

      part[y].position = new Vector3(
        -(pos[0] + (size[0] - add / 2) / 2) * scale,
        (pos[1] + (size[1] - add / 2) / 2) * scale,
        (pos[2] + (size[2] - add / 2) / 2) * scale
      );

      const mat = noa.rendering.makeStandardMaterial("modelmaterial-" + mdata.name + "-" + y);
      part[y].material = mat;

      part[y].opaque = false;
    }
    const mesh = Mesh.MergeMeshes(part, true, true, undefined, true, true);
    mesh!.setParent(main);
    mesh!.setPivotMatrix(Matrix.Translation(-pivot[0] * scale, -pivot[1] * scale, -pivot[2] * scale));
  }

  templateModels[name] = main;

  return main;
}

export function addNametag(noa: Engine, mainMesh: Mesh, name: string, height: number) {
  const scene = noa.rendering.getScene();

  const font_size = 96;
  const font = "bold " + font_size + "px 'Lattice Pixel'";

  //Set height for plane
  const planeHeight = 0.3;

  //Set height for dynamic texture
  const DTHeight = 1.5 * font_size; //or set as wished

  //Calcultae ratio
  const ratio = planeHeight / DTHeight;

  //Use a temporay dynamic texture to calculate the length of the text on the dynamic texture canvas
  const temp = new DynamicTexture("DynamicTexture", 64, scene, false);
  const tmpctx = temp.getContext();
  tmpctx.font = font;
  const DTWidth = tmpctx.measureText(name).width + 32;

  //Calculate width the plane has to be
  const planeWidth = DTWidth * ratio;

  //Create dynamic texture and write the text
  const dynamicTexture = new DynamicTexture("DynamicTexture", { width: DTWidth, height: DTHeight }, scene, false);
  const mat = noa.rendering.makeStandardMaterial("nametag");
  mat.diffuseTexture = dynamicTexture;
  mat.emissiveTexture = mat.diffuseTexture;
  mat.diffuseTexture.hasAlpha = true;
  mat.opacityTexture = mat.diffuseTexture;
  dynamicTexture.drawText(name, null, null, font, "#eeeeee", "#00000066", true);

  //Create plane and set dynamic texture as material
  const plane = MeshBuilder.CreatePlane("plane", { width: planeWidth, height: planeHeight }, scene);
  plane.material = mat;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  plane.opaque = false;
  plane.rotation.x = 0;
  plane.rotation.y = 0;

  plane.setParent(mainMesh);
  plane.setPositionWithLocalVector(new Vector3(0, height + 1.2, 0));
  noa.rendering.addMeshToScene(plane);

  return plane;
}

export function redrawNametag(noa: Engine, mainMesh: Mesh, name: string) {
  const childMeshes = mainMesh.getChildMeshes(true);
  const nameTag: Mesh = childMeshes[childMeshes.length - 1] as Mesh;
  const scene = noa.rendering.getScene();

  const font_size = 96;
  const font = "bold " + font_size + "px 'Lattice Pixel'";

  //Set height for dynamic texture
  const DTHeight = 1.5 * font_size; //or set as wished

  //Use a temporay dynamic texture to calculate the length of the text on the dynamic texture canvas
  const temp = new DynamicTexture("DynamicTexture", 64, scene, false);
  const tmpctx = temp.getContext();
  tmpctx.font = font;
  const DTWidth = tmpctx.measureText(name).width + 32;

  //Create dynamic texture and write the text
  const dynamicTexture = new DynamicTexture("DynamicTexture", { width: DTWidth, height: DTHeight }, scene, false);
  const mat = noa.rendering.makeStandardMaterial("nametag");
  mat.diffuseTexture = dynamicTexture;
  mat.emissiveTexture = mat.diffuseTexture;
  mat.diffuseTexture.hasAlpha = true;
  mat.opacityTexture = mat.diffuseTexture;
  dynamicTexture.drawText(name, null, null, font, "#eeeeee", "#00000066", true);
  const planeHeight = 0.3;
  const ratio = planeHeight / DTHeight;
  const planeWidth = DTWidth * ratio;
  nameTag.scaling.x = planeWidth;
  nameTag.material = mat;
}
