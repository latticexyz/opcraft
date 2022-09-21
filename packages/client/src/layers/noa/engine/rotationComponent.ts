import { Vector3 } from "@babylonjs/core";
import { Engine } from "noa-engine";

export function registerRotationComponent(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: "rotation",
    state: { rotation: new Vector3() },
  });
}
