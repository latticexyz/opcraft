import { Engine } from "noa-engine";

export function registerModelComponent(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.ents.createComponent({
    name: "model",
    state: { models: {} },
  });
}
