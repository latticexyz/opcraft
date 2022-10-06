import { Quaternion, Vector3, Vector4 } from "@babylonjs/core";
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
    onAdd: (id: number, state: RotationComponent) => {
      state.rotation = new Vector3();
    },
  });
}

export const TARGETED_ROTATION_COMPONENT = "TARGETED_ROTATION_COMPONENT";

export interface TargetedRotationComponent {
  points: Vector4[];
  currentTick: number;
  __id?: number;
}
const NUMBER_OF_TICKS_IN_CURVE = 5;

function getPoint(targetedRotations: Vector4[], currentTick: number): Vector3 {
  const firstV = targetedRotations[0];
  const secondV = targetedRotations[1];
  const a = Quaternion.FromArray([firstV.x, firstV.y, firstV.z, firstV.w]);
  const b = Quaternion.FromArray([secondV.x, secondV.y, secondV.z, secondV.w]);
  const out = Quaternion.Slerp(a, b, currentTick / (NUMBER_OF_TICKS_IN_CURVE - 1));
  return out.toEulerAngles();
}

export function registerTargetedRotationComponent(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: TARGETED_ROTATION_COMPONENT,
    state: { points: [], currentTick: 0 },
    onAdd: (id: number, state: TargetedRotationComponent) => {
      state.points = [];
      state.currentTick = 0;
    },
    system: function (dt: number, states: TargetedRotationComponent[]) {
      for (let i = 0; i < states.length; i++) {
        const { points, currentTick } = states[i];
        const id = states[i].__id;
        if (id && points.length === 2) {
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
