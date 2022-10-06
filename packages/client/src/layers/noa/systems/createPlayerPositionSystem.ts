import { Quaternion, Vector3, Vector4 } from "@babylonjs/core";
import {
  defineSystem,
  EntityIndex,
  Has,
  UpdateType,
  isComponentUpdate,
  defineSyncSystem,
  getComponentValueStrict,
} from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import {
  getNoaComponentStrict,
  getNoaPositionStrict,
  removeNoaComponent,
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
import { pixelToChunkCoord } from "@latticexyz/phaserx";
import { RELAY_CHUNK_SIZE } from "./createRelaySystem";

const MODEL_DATA = "./assets/models/player.json";
const MODEL_TEXTURE = "./assets/skins/player1.png";

export function createPlayerPositionSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    noa,
    mudToNoaId,
    components: { PlayerPosition, PlayerRelayerChunkPosition, PlayerDirection },
  } = context;

  const { world } = network;

  function spawnPlayer(entity: EntityIndex, address: string) {
    const isMappingStored = mudToNoaId.has(entity);
    const noaEntity: number = mudToNoaId.get(entity) ?? noa.entities.add();
    if (!isMappingStored) {
      mudToNoaId.set(entity, noaEntity);
    }

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

  function despawnPlayer(entity: EntityIndex) {
    const isMappingStored = mudToNoaId.has(entity);
    const noaEntity: number = mudToNoaId.get(entity) ?? noa.entities.add();
    if (!isMappingStored) {
      console.error("Can't despawn non existing noa entity: " + noaEntity);
    }
    removeNoaComponent(noa, noaEntity, noa.entities.names.mesh);
    removeNoaComponent(noa, noaEntity, ROTATION_COMPONENT);
    removeNoaComponent(noa, noaEntity, TARGETED_ROTATION_COMPONENT);
    removeNoaComponent(noa, noaEntity, TARGETED_POSITION_COMPONENT);
  }

  defineSyncSystem(
    world,
    [Has(PlayerPosition), Has(PlayerDirection)],
    () => PlayerRelayerChunkPosition,
    (entity) => {
      const position = getComponentValueStrict(PlayerPosition, entity);
      const chunkCoord = pixelToChunkCoord({ x: position.x, y: position.z }, RELAY_CHUNK_SIZE);
      return chunkCoord;
    }
  );

  defineSystem(world, [Has(PlayerPosition), Has(PlayerDirection)], (update) => {
    if (update.type === UpdateType.Enter) {
      const address = world.entities[update.entity];
      spawnPlayer(update.entity, address.substring(0, 10));
    }
    if (update.type === UpdateType.Exit) {
      despawnPlayer(update.entity);
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
