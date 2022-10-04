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
    state: { yaw: 0, pitch: 0 },
  });
}

export const TARGETED_ROTATION_COMPONENT = "TARGETED_ROTATION_COMPONENT";

export function registerTargetedRotationComponent(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: TARGETED_ROTATION_COMPONENT,
    state: { yaw: 0, pitch: 0 },
  });
}
