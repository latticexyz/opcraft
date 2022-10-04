import { VoxelCoord } from "@latticexyz/utils";
import { Engine } from "noa-engine";

export function hasNoaComponent(noa: Engine, entity: number, componentName: string): boolean {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const s = noa.entities.getState(entity, componentName);
  if (!s) {
    return false;
  }
  return true;
}

export function getNoaComponentStrict<S>(noa: Engine, entity: number, componentName: string): S {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const s = noa.entities.getState(entity, componentName);
  if (!s) {
    throw new Error(`NOA: no component ${componentName} on entity ${entity}`);
  }
  return s as S;
}

export function setNoaComponent<S extends Record<string, any>>(
  noa: Engine,
  entity: number,
  componentName: string,
  data: Partial<S>
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const s = noa.entities.getState(entity, componentName);
  if (!s) {
    throw new Error(`NOA: no component ${componentName} on entity ${entity}`);
  }
  for (const k of Object.keys(data)) {
    s[k] = data[k];
  }
}

export function setNoaPosition(noa: Engine, entity: number, position: VoxelCoord) {
  noa.entities.setPosition(entity, position.x, position.y, position.z);
}

export function getNoaPositionStrict(noa: Engine, entity: number): VoxelCoord {
  const data = noa.ents.getPositionData(entity)?.position;
  if (!data) {
    throw new Error("NOA: no position data for " + entity);
  }
  const [x, y, z] = data;
  return { x, y, z };
}
