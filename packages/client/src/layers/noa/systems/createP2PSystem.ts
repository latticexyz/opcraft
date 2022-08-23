import { NetworkLayer } from "../../network/types";
import { NoaLayer } from "../types";
import { io } from "socket.io-client";
import { setComponent } from "@latticexyz/recs";

export function createP2PSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    world,
    components: { PlayerPosition, PlayerDirection },
    noa,
  } = context;

  const {
    network: { connectedAddress },
  } = network;

  const socket = io("https://mud-p2p.lattice.xyz");

  const playerEntity = connectedAddress.get();

  function sharePosition(position: number[], direction: number[]) {
    socket.emit("newMessage", {
      version: 1,
      topic: "position",
      label: "chunk(0,0)",
      action: "componentValueSet",
      data: [playerEntity, ...position, ...direction],
      timestamp: Math.floor(Date.now() / 1000),
      signature: null,
    });
  }

  function onMessage(message: any) {
    const [entity, x, y, z, dx, dy, dz] = message.data;
    console.log("Setting player position for", entity, { x, y, z });

    if (entity !== playerEntity) {
      setComponent(PlayerPosition, entity, { x, y, z });
      setComponent(PlayerDirection, entity, { x: dx, y: dy, z: dz });
    }
  }

  function onConnect() {
    const engine = socket.io.engine;
    engine.once("upgrade", () => {
      // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
      logger.logWithTopic("p2p", "connected with transport", engine.transport.name); // in most cases, prints "websocket"
    });

    socket.on("newMessage", onMessage);
    socket.emit("subscribe", "chunk(0,0)");
  }

  socket.on("connect", onConnect);

  const interval = setInterval(() => {
    const data = noa.entities.getPositionData(noa.playerEntity);

    if (!data?.position) {
      return console.warn("No position found for player entity");
    }

    const direction = noa.camera.getDirection();
    const lookAt = data.position.map((v, i) => v + 30 * direction[i]);

    sharePosition(data.position, lookAt);
  }, 1000);

  world.registerDisposer(() => {
    socket.removeAllListeners("newMessage");
    socket.removeAllListeners("connect");
    clearInterval(interval);
  });
}
