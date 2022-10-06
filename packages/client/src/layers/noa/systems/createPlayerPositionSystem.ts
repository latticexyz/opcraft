import { Mesh, Quaternion, Vector3, Vector4 } from "@babylonjs/core";
import { defineSystem, EntityIndex, Has, UpdateType, isComponentUpdate } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import {
  getNoaComponentStrict,
  getNoaPositionStrict,
  setNoaComponent,
  setNoaPosition,
} from "../engine/components/utils";
import { applyModel } from "../engine/model";
import { NoaLayer } from "../types";
import {
  RotationComponent,
  ROTATION_COMPONENT,
  TargetedRotationComponent,
  TARGETED_ROTATION_COMPONENT,
} from "../engine/components/rotationComponent";
import { TargetedPositionComponent, TARGETED_POSITION_COMPONENT } from "../engine/components/targetedPositionComponent";
import { eq, ZERO_VECTOR } from "../../../utils/coord";

const MODEL_DATA = "./assets/models/player.json";
const MODEL_TEXTURE = "./assets/skins/player1.png";

export function createPlayerPositionSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    noa,
    mudToNoaId,
    components: { PlayerPosition, PlayerDirection },
  } = context;

  const { world } = network;

  function spawnPlayer(entity: EntityIndex, address: string) {
    const isMappingStored = mudToNoaId.has(entity);
    const noaEntity: number = mudToNoaId.get(entity) ?? noa.entities.add();
    if (!isMappingStored) {
      mudToNoaId.set(entity, noaEntity);
    }

    const scene = noa.rendering.getScene();
    const mesh = Mesh.CreateBox("player-mesh", 1, scene);
    // if (w != null) mesh.scaling.x = w;
    // if (w != null) mesh.scaling.z = w;
    // if (h != null) mesh.scaling.y = h;

    noa.entities.addComponentAgain(noaEntity, noa.entities.names.mesh, {
      mesh: mesh,
      // offset vector is needed because noa positions are always the
      // bottom-center of the entity, and Babylon's CreateBox gives a
      // mesh registered at the center of the box
      offset: [0, 1 / 2, 0],
    });
    noa.entities.addComponentAgain(noaEntity, ROTATION_COMPONENT, {
      yaw: 0,
      pitch: 0,
    });
    noa.entities.addComponentAgain(noaEntity, TARGETED_ROTATION_COMPONENT, {
      yaw: 0,
      pitch: 0,
    });
    noa.entities.addComponentAgain(noaEntity, TARGETED_POSITION_COMPONENT, ZERO_VECTOR);
    setNoaPosition(noa, noaEntity, ZERO_VECTOR);
    applyModel(noa, noaEntity, MODEL_DATA, MODEL_TEXTURE, address);
  }

  // Everything with a position that is no block is considered a player
  defineSystem(world, [Has(PlayerPosition), Has(PlayerDirection)], (update) => {
    if (update.type === UpdateType.Enter) {
      const address = world.entities[update.entity];
      spawnPlayer(update.entity, address.substring(0, 10));
    }
    if (update.type === UpdateType.Exit) {
      // Remove player
      // TODO: figure out how to remove an entity in NOA
      return;
    }

    const noaEntity = mudToNoaId.get(update.entity);
    if (noaEntity == null) return console.error("Need to spawn entity first", update.entity);
    if (isComponentUpdate(update, PlayerPosition) && update.value[0]) {
      const position = getNoaPositionStrict(noa, noaEntity);
      if (eq(ZERO_VECTOR, position)) {
        setNoaPosition(noa, noaEntity, update.value[0]);
      }
      const { points } = getNoaComponentStrict<TargetedPositionComponent>(noa, noaEntity, TARGETED_POSITION_COMPONENT);
      const { x, y, z } = update.value[0];
      points.push(new Vector3(x, y, z));
      if (points.length > 4) {
        points.splice(0, 1);
      } else {
        while (points.length < 4) {
          points.push(new Vector3(x, y, z));
        }
      }
      setNoaComponent<TargetedPositionComponent>(noa, noaEntity, TARGETED_POSITION_COMPONENT, {
        points,
        currentTick: 0,
      });
    }
    if (isComponentUpdate(update, PlayerDirection) && update.value[0]) {
      const { rotation } = getNoaComponentStrict<RotationComponent>(noa, noaEntity, ROTATION_COMPONENT);
      const { qx, qy, qz, qw } = update.value[0];
      const quaternion = Quaternion.FromArray([qx, qy, qz, qw]);
      if (eq(ZERO_VECTOR, rotation)) {
        setNoaComponent<RotationComponent>(noa, noaEntity, ROTATION_COMPONENT, {
          rotation: quaternion.toEulerAngles(),
        });
      }
      const { points } = getNoaComponentStrict<TargetedRotationComponent>(noa, noaEntity, TARGETED_ROTATION_COMPONENT);
      points.push(new Vector4(qx, qy, qz, qw));
      if (points.length > 2) {
        points.splice(0, 1);
      } else {
        while (points.length < 2) {
          points.push(new Vector4(qx, qy, qz, qw));
        }
      }
      setNoaComponent<TargetedRotationComponent>(noa, noaEntity, TARGETED_ROTATION_COMPONENT, {
        points,
        currentTick: 0,
      });
    }
  });
}
