import { Engine } from "noa-engine";

export function monkeyPatchMeshComponent(noa: Engine) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.entities.removeComponent(noa.playerEntity, noa.entities.names.fadeOnZoom);
  const toMonkeyPatch = (dt: any, states: any) => {
    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const id = state.__id;
      const rpos = noa.ents.getPositionData(id)!._renderPosition!;
      state.mesh.position.copyFromFloats(
        rpos[0] + state.offset[0],
        rpos[1] + state.offset[1],
        rpos[2] + state.offset[2]
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const rotationComponent = noa.ents.getState(id, "rotation");
      if (id === noa.playerEntity) {
        const yaw = noa.camera.heading;
        const pitch = noa.camera.pitch;
        state.mesh.rotation.copyFromFloats(pitch, yaw, 0);
      } else if (rotationComponent) {
        const { rotation } = rotationComponent;
        const yaw = rotation.y;
        const pitch = rotation.x;
        state.mesh.rotation.copyFromFloats(pitch, yaw, 0);
      }
    }
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  noa.entities.components.mesh.renderSystem = toMonkeyPatch;
}