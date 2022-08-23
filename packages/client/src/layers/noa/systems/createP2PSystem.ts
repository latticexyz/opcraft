import { NetworkLayer } from "../../network/types";
import { NoaLayer } from "../types";
import { io } from "socket.io-client";
import { VoxelCoord } from "@latticexyz/utils";
import { setComponent } from "@latticexyz/recs";

export function createP2PSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    components: { PlayerPosition },
    noa,
  } = context;

  const {
    world,
    network: { connectedAddress },
  } = network;

  const socket = io("https://mud-p2p.lattice.xyz");

  const playerEntity = connectedAddress.get();
  console.log("Player entity");

  function sharePosition(position: VoxelCoord) {
    socket.emit("newMessage", {
      version: 1,
      topic: "position",
      label: "chunk(0,0)",
      action: "componentValueSet",
      data: [playerEntity, position.x, position.y, position.z],
      timestamp: Math.floor(Date.now() / 1000),
      signature: null,
    });
    logger.logWithTopic("p2p", "newMessage sent");
  }

  socket.on("connect", () => {
    const engine = socket.io.engine;
    logger.logWithTopic("p2p", "connected with transport", engine.transport.name); // in most cases, prints "polling"
    engine.once("upgrade", () => {
      // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
      logger.logWithTopic("p2p", "connected with transport", engine.transport.name); // in most cases, prints "websocket"
    });

    socket.on("newMessage", (message) => {
      logger.logWithTopic("p2p", "received message", JSON.stringify(message));
      const [entity, x, y, z] = message.data;
      console.log("Setting player position for", entity, { x, y, z });

      if (entity !== playerEntity) setComponent(PlayerPosition, entity, { x, y, z });
    });

    socket.emit("subscribe", "chunk(0,0)");
  });

  const interval = setInterval(() => {
    const data = noa.entities.getPositionData(noa.playerEntity);
    if (!data?.position) {
      return console.warn("No position found for player entity");
    }
    const currentPos = {
      x: Math.floor(data.position[0]),
      y: Math.floor(data.position[1]),
      z: Math.floor(data.position[2]),
    };
    sharePosition(currentPos);
  }, 1000);

  world.registerDisposer(() => {
    clearInterval(interval);
  });
}
