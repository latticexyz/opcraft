import { Curve3, Vector3 } from "@babylonjs/core";
import { Engine } from "noa-engine";
import { setNoaComponent } from "./utils";

export interface RotationComponent {
  rotation: Vector3;
}

export const ROTATION_COMPONENT = "ROTATION_COMPONENT";

export function registerRotationComponent(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: ROTATION_COMPONENT,
    state: { rotation: new Vector3() },
  });
}

export const TARGETED_ROTATION_COMPONENT = "TARGETED_ROTATION_COMPONENT";

export interface TargetedRotationComponent {
  points: Vector3[];
  currentTick: number;
  __id?: number;
}
const NUMBER_OF_TICKS_IN_CURVE = 5;

function getPoint(targetedRotations: Vector3[], currentTick: number) {
  const CatmullRomSpline = Curve3.CreateCatmullRomSpline(targetedRotations, NUMBER_OF_TICKS_IN_CURVE, false);
  const points = CatmullRomSpline.getPoints();
  return points[NUMBER_OF_TICKS_IN_CURVE + currentTick];
}

export function registerTargetedRotationComponent(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: TARGETED_ROTATION_COMPONENT,
    state: { points: [], currentTick: 0 },
    system: function (dt: number, states: TargetedRotationComponent[]) {
      for (let i = 0; i < states.length; i++) {
        const { points, currentTick } = states[i];
        const id = states[i].__id;
        if (id) {
          const point = getPoint(points, currentTick);
          setNoaComponent<RotationComponent>(noa, id, ROTATION_COMPONENT, { rotation: point });
        }
        if (currentTick < NUMBER_OF_TICKS_IN_CURVE - 1) {
          states[i].currentTick++;
        }
      }
    },
  });
}
