import { Engine } from "noa-engine";
import { Vector3, Curve3 } from "@babylonjs/core";
import { getNoaComponentStrict, hasNoaComponent } from "./utils";
import { MeshComponent, MESH_COMPONENT } from "./defaultComponent";

export interface TargetedPositionComponent {
  points: Vector3[];
  currentTick: number;
  __id?: number;
}

export const TARGETED_POSITION_COMPONENT = "TARGETED_POSITION_COMPONENT";
const NUMBER_OF_TICKS_IN_CURVE = 5;
const MOVEMENT_TICKS = 60;

function getPoint(targetedPositions: Vector3[], currentTick: number) {
  const CatmullRomSpline = Curve3.CreateCatmullRomSpline(targetedPositions, NUMBER_OF_TICKS_IN_CURVE, false);
  const points = CatmullRomSpline.getPoints();
  return points[NUMBER_OF_TICKS_IN_CURVE + currentTick];
}

export function registerTargetedPositionComponent(noa: Engine) {
  let currentAnimationTick = 0;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: TARGETED_POSITION_COMPONENT,
    state: { points: [], currentTick: 0 },
    onAdd: (id: number, state: TargetedPositionComponent) => {
      state.points = [];
      state.currentTick = 0;
    },
    system: function (dt: number, states: TargetedPositionComponent[]) {
      currentAnimationTick++;
      for (let i = 0; i < states.length; i++) {
        const { points, currentTick } = states[i];
        const id = states[i].__id;
        if (id && points.length === 4) {
          const point = getPoint(points, currentTick);
          const noY1 = points[2].clone();
          noY1.y = 0;
          const noY2 = points[1].clone();
          noY2.y = 0;
          const speed = Math.min(2.5, Math.sqrt(noY1.subtract(noY2).lengthSquared()));
          noa.entities.setPosition(id, [point.x, point.y, point.z]);
          animateFrameOfMesh(noa, id, speed, currentAnimationTick);
        }
        if (currentTick < NUMBER_OF_TICKS_IN_CURVE - 1) {
          states[i].currentTick++;
        }
      }
      if (currentAnimationTick >= MOVEMENT_TICKS) {
        currentAnimationTick = 0;
      }
    },
  });
}

function animateFrameOfMesh(noa: Engine, entity: number, speed: number, currentTick: number) {
  if (!hasNoaComponent(noa, entity, MESH_COMPONENT)) return;
  const { mesh } = getNoaComponentStrict<MeshComponent>(noa, entity, MESH_COMPONENT);
  if (!mesh) return;
  const progress = Math.PI * 2 * (currentTick / (MOVEMENT_TICKS - 1)) * speed;
  const sin = (Math.sin(progress) / 2) * speed;
  const childMeshes = mesh.getChildMeshes(true);
  childMeshes[3].rotation.x = -sin;
  childMeshes[4].rotation.x = sin;
  childMeshes[5].rotation.x = -sin;
  childMeshes[6].rotation.x = sin;
}
