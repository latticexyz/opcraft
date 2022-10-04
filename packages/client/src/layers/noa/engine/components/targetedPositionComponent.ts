import { Engine } from "noa-engine";
import { Vector3, Curve3 } from "@babylonjs/core";

export interface TargetedPositionComponent {
  points: Vector3[];
  currentTick: number;
  __id?: number;
}

export const TARGETED_POSITION_COMPONENT = "TARGETED_POSITION_COMPONENT";
const NUMBER_OF_TICKS_IN_CURVE = 5;

function getPoint(targetedPositions: Vector3[], currentTick: number) {
  const CatmullRomSpline = Curve3.CreateCatmullRomSpline(targetedPositions, NUMBER_OF_TICKS_IN_CURVE, false);
  const points = CatmullRomSpline.getPoints();
  return points[NUMBER_OF_TICKS_IN_CURVE + currentTick];
}

export function registerTargetedPositionComponent(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: TARGETED_POSITION_COMPONENT,
    state: { points: [], currentTick: 0 },
    system: function (dt: number, states: TargetedPositionComponent[]) {
      for (let i = 0; i < states.length; i++) {
        const { points, currentTick } = states[i];
        const id = states[i].__id;
        if (id) {
          const point = getPoint(points, currentTick);
          noa.entities.setPosition(id, [point.x, point.y, point.z]);
        }
        if (currentTick < NUMBER_OF_TICKS_IN_CURVE - 1) {
          states[i].currentTick++;
        }
      }
    },
  });
}
