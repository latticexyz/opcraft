import { Quaternion } from "@babylonjs/core";
import { NetworkLayer } from "../../network/types";
import { NoaLayer } from "../types";
import { defineRxSystem, EntityID, setComponent } from "@latticexyz/recs";
import { concatUint8Arrays, Int32ArrayToUint8Array, splitUint8Arrays, Uint8ArrayToInt32Array } from "@latticexyz/utils";
import { PositionComponent, POSITION_COMPONENT } from "../engine/components/defaultComponent";
import { getNoaComponentStrict } from "../engine/components/utils";

const PRECISION = 2;

function toFixedPoint(n: number): number {
  return Math.floor(n * Math.pow(10, PRECISION));
}

function fromFixedPoint(n: number): number {
  return n / Math.pow(10, PRECISION);
}

function encodeMessage(position: number[], direction: number[]): Uint8Array {
  const transformedData = [...position, ...direction].map(toFixedPoint);
  const data = Int32ArrayToUint8Array(transformedData);
  return concatUint8Arrays(data);
}

function decodeMessage(data: Uint8Array): { position: number[]; direction: number[] } {
  const [positionBytes, directionBytes] = splitUint8Arrays(data, [12, 16]);
  return {
    position: Uint8ArrayToInt32Array(positionBytes).map(fromFixedPoint),
    direction: Uint8ArrayToInt32Array(directionBytes).map(fromFixedPoint),
  };
}

export function createRelaySystem(network: NetworkLayer, context: NoaLayer) {
  const {
    world,
    components: { PlayerPosition, PlayerDirection },
    noa,
  } = context;

  const {
    network: { connectedAddress },
    relay,
  } = network;

  if (!relay) {
    console.warn("ECS message relayer not available. Not syncronizing player positions.");
    return;
  }

  // TODO: add proper chunking logic
  relay.subscribe("chunk(0,0)");

  function relayPositionAndDirection(position: number[], direction: number[]) {
    relay?.push("chunk(0,0)", encodeMessage(position, direction));
  }

  const interval = setInterval(() => {
    const positionData = getNoaComponentStrict<PositionComponent>(noa, noa.playerEntity, POSITION_COMPONENT);
    if (!positionData?.position) {
      return console.warn("No position found for player entity");
    }
    const { position } = positionData;
    const pitch = noa.camera.pitch;
    const yaw = noa.camera.heading;
    const q = Quaternion.FromEulerAngles(pitch, yaw, 0);
    const quaternion: number[] = [];
    q.toArray(quaternion);
    relayPositionAndDirection(position, quaternion);
  }, 300);

  defineRxSystem(world, relay.event$, ({ message, address }) => {
    const {
      position: [x, y, z],
      direction: [qx, qy, qz, qw],
    } = decodeMessage(message.data);
    if (address === connectedAddress.get()) return;
    const entity = world.registerEntity({ id: address as EntityID });
    setComponent(PlayerPosition, entity, { x, y, z });
    setComponent(PlayerDirection, entity, { qx, qy, qz, qw });
  });

  world.registerDisposer(() => {
    clearInterval(interval);
  });
}
