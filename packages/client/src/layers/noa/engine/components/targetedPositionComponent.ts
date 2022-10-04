import { Engine } from "noa-engine";

export interface TargetedPositionComponent {
  position: null | number[];
}

export const TARGETED_POSITION_COMPONENT = "TARGETED_POSITION_COMPONENT";

export function registerTargetedPositionComponent(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: TARGETED_POSITION_COMPONENT,
    state: { x: 0, y: 0, z: 0 },
  });
}
