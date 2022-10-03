import { NetworkLayer } from "../../network/types";
import { NoaLayer } from "../types";
import { defineRxSystem, EntityID, setComponent } from "@latticexyz/recs";
import { concatUint8Arrays, Int32ArrayToUint8Array, splitUint8Arrays, Uint8ArrayToInt32Array } from "@latticexyz/utils";

function encodeMessage(position: number[], direction: number[]): Uint8Array {
  const data = Int32ArrayToUint8Array([...position, ...direction]);
  return concatUint8Arrays(data);
}

function decodeMessage(data: Uint8Array): { position: number[]; direction: number[] } {
  const [positionBytes, directionBytes] = splitUint8Arrays(data, [12, 12]);
  return {
    position: Uint8ArrayToInt32Array(positionBytes),
    direction: Uint8ArrayToInt32Array(directionBytes),
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

  function setPosition(position: number[], direction: number[]) {
    relay?.push("chunk(0,0)", encodeMessage(position, direction));
  }

  const interval = setInterval(() => {
    const data = noa.entities.getPositionData(noa.playerEntity);

    if (!data?.position) {
      return console.warn("No position found for player entity");
    }

    const direction = noa.camera.getDirection();
    // TODO: fix direction
    const lookAt = data.position.map((v, i) => v + 30 * direction[i]);

    setPosition(data.position, lookAt);
  }, 100);

  defineRxSystem(world, relay.event$, ({ message, address }) => {
    const {
      position: [x, y, z],
      direction: [dx, dy, dz],
    } = decodeMessage(message.data);
    if (address === connectedAddress.get()) return;

    const entity = world.registerEntity({ id: address as EntityID });

    setComponent(PlayerPosition, entity, { x, y, z });
    setComponent(PlayerDirection, entity, { x: dx, y: dy, z: dz });
  });

  world.registerDisposer(() => {
    clearInterval(interval);
  });
}
