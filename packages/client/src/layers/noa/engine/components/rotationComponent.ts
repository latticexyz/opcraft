import { Vector3 } from "@babylonjs/core";
import { Engine } from "noa-engine";

export interface RotationComponent {
  yaw: number;
  pitch: number;
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
