import {
  EntityID,
  EntityIndex,
  getComponentValue,
  namespaceWorld,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { awaitValue } from "@latticexyz/utils";
import { observable } from "mobx";
import { DataConnection, Peer } from "peerjs";
import { NetworkLayer } from "../network";
import { defineSelectedSlotComponent } from "./components";
import { defineCraftingTableComponent } from "./components/CraftingTable";
import { defineLocalPositionComponent } from "./components/LocalPosition";
import { Singleton } from "./constants";
import { setupNoaEngine } from "./setup";
import { createBlockSystem, createInputSystem, createPositionSystem } from "./systems";
import { createSyncSystem } from "./systems/createSyncSystem";

const DEFAULT_PEER_JS_URL = "https://71f6-100-12-0-67.ngrok.io";
// const DEFAULT_PEER_JS_URL = "https://peerjs.lattice.xyz";
const DEFAULT_PEER_JS_KEY = "peerjs";

enum Side {
  INITIATOR,
  RECEIVER,
}
interface Metadata {
  from: string;
  to?: string;
  side: Side;
}

const isMetadataFilled = (M: Metadata | undefined) => {
  if (!M) return false;
  return !!M.from && !!M.to && M.side !== undefined;
};

const getMsTime = () => Date.now();

export function createNoaLayer(network: NetworkLayer) {
  const world = namespaceWorld(network.world, "noa");

  const SingletonEntity = world.registerEntity({ id: Singleton });

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedSlot: defineSelectedSlotComponent(world),
    CraftingTable: defineCraftingTableComponent(world),
    LocalPosition: defineLocalPositionComponent(world),
  };

  // --- SETUP ----------------------------------------------------------------------
  const { noa, setBlock } = setupNoaEngine(network.api.getBlockAtPosition);

  // --- API ------------------------------------------------------------------------
  function setCraftingTable(entities: EntityIndex[]) {
    setComponent(components.CraftingTable, SingletonEntity, { value: entities.slice(0, 9) });
  }

  function setCraftingTableIndex(index: number, entity: EntityIndex) {
    const currentCraftingTable = getComponentValue(components.CraftingTable, SingletonEntity)?.value ?? [];
    const newCraftingTable = [...currentCraftingTable];
    newCraftingTable[index] = entity;
    setComponent(components.CraftingTable, SingletonEntity, { value: newCraftingTable });
  }

  function clearCraftingTable() {
    removeComponent(components.CraftingTable, SingletonEntity);
  }

  // --- P2P ------------------------------------------------------------------------
  const peerJsParsedUrl = new URL(network.config.peerJsUrl || DEFAULT_PEER_JS_URL);
  const peerJsHost = peerJsParsedUrl.hostname;
  const secure = peerJsParsedUrl.protocol.includes("https");
  const unparsedPort = peerJsParsedUrl.port;
  const port = unparsedPort.length > 0 ? parseInt(unparsedPort) : secure ? 443 : 80;
  const peerObject = observable.box<Peer>();
  const connections: {
    [key: string]: { connection: DataConnection; metadata: Metadata; lastPong: number } | undefined;
  } = {};

  const onData = (
    data: any,
    currentMetadata: Metadata,
    setMetadata: (metadata: Metadata) => void,
    setLastPong: (pong: number) => void,
    send: (data: any) => void
  ) => {
    console.log("[Peer] New Data!", data);
    if (Object.keys(data).includes("myAddress")) {
      // We are updating the metadata
      console.log("[Peer] setting reiver address: " + data.myAddress);
      setMetadata({ from: currentMetadata.from, to: data.myAddress, side: Side.INITIATOR });
    } else if (Object.keys(data).includes("x")) {
      console.log("[Peer]", currentMetadata);
      const peerAddress = (
        currentMetadata.side === Side.INITIATOR ? currentMetadata.to : currentMetadata.from
      ) as EntityID;
      if (!peerAddress) {
        console.error("We don't know the address of our peer!");
        return;
      }
      const entityIndex = world.registerEntity({ id: peerAddress as EntityID });
      console.log(
        "[Peer] Setting position of entity=" +
          peerAddress +
          " at position x=" +
          data.x +
          " y=" +
          data.y +
          " z=" +
          data.z
      );
      setComponent(context.components.LocalPosition, entityIndex, data);
    } else if (Object.keys(data).includes("ping")) {
      send({ pong: true });
    } else if (Object.keys(data).includes("pong")) {
      setLastPong(getMsTime());
    }
  };

  const onPeerLost = (connectionId: string, currentMetadata: Metadata) => {
    const peerAddress = (
      currentMetadata.side === Side.INITIATOR ? currentMetadata.to : currentMetadata.from
    ) as EntityID;
    console.log("[Peer] Peer disconnected: " + peerAddress);
    if (world.hasEntity(peerAddress)) {
      const entityIndex = world.getEntityIndexStrict(peerAddress as EntityID);
      removeComponent(context.components.LocalPosition, entityIndex);
      connections[connectionId] = undefined;
    }
  };

  const onNewPeer = async (connection: DataConnection) => {
    const connectedAddress = await awaitValue(network.network.connectedAddress);
    const side = connectedAddress === connection.metadata ? Side.INITIATOR : Side.RECEIVER;
    const metadata: Metadata = {
      from: connection.metadata,
      side,
      to: connectedAddress !== connection.metadata ? connectedAddress : undefined,
    };
    console.log("[Peer] New Peer!. We are ", side === Side.INITIATOR ? "initiator" : "receiver");
    connections[connection.connectionId] = {
      connection,
      metadata,
      lastPong: getMsTime(),
    };
    const ping = setInterval(() => {
      if (!isMetadataFilled(connections[connection.connectionId]?.metadata)) {
        console.log("[Peer] waiting for metadata");
        return;
      }
      console.log("[Peer] Pinging peer: " + connection.connectionId);
      if (connections[connection.connectionId]) {
        connections[connection.connectionId]?.connection.send({ ping: true });
        if (getMsTime() - 5000 > (connections[connection.connectionId]?.lastPong || 0)) {
          clearInterval(ping);
          console.log("[Peer] Disconnecting unresponsive peer");
          onPeerLost(connection.connectionId, connections[connection.connectionId]!.metadata);
        }
      } else {
        clearInterval(ping);
      }
    }, 1000);
    world.registerDisposer(() => clearInterval(ping));
    if (side === Side.RECEIVER) {
      console.warn("[Peer] sending address");
      setTimeout(() => connections[connection.connectionId]?.connection.send({ myAddress: connectedAddress }), 1000);
    }
    connection.on("data", (data) =>
      onData(
        data,
        connections[connection.connectionId]!.metadata,
        (m: Metadata) => {
          console.log("[Peer] setting metadata", m);
          if (connections[connection.connectionId] !== undefined) {
            connections[connection.connectionId]!.metadata = { ...m };
          }
        },
        (pong: number) => {
          if (connections[connection.connectionId] !== undefined) {
            connections[connection.connectionId]!.lastPong = pong;
          }
        },
        (data: any) => connection.send(data)
      )
    );
    connection.on("close", () => onPeerLost(connection.connectionId, connections[connection.connectionId]!.metadata));
  };

  const setupPeer = async () => {
    const connectedAddress = await awaitValue(network.network.connectedAddress);
    const peer = new Peer({
      debug: 3,
      secure,
      port,
      key: DEFAULT_PEER_JS_KEY,
      host: peerJsHost,
    });

    peer.on("connection", (d) => {
      onNewPeer(d);
    });

    world.registerDisposer(() => peer.destroy());
    peerObject.set(peer);
    // Connect to initial peer list
    const res = await fetch((network.config.peerJsUrl || DEFAULT_PEER_JS_URL) + "/" + DEFAULT_PEER_JS_KEY + "/peers");
    const connectedPeers = await res.json();
    connectedPeers.forEach((c: string) => {
      const d = peer.connect(c, { metadata: connectedAddress });
      onNewPeer(d);
    });
    world.registerDisposer(() => {
      Object.keys(connections).forEach((connectionId) => connections[connectionId]?.connection.close());
    });
  };

  setupPeer();

  const context = {
    world,
    components,
    peer: {
      peerObject,
      connections,
    },
    noa,
    api: { setBlock, setCraftingTable, clearCraftingTable, setCraftingTableIndex },
    SingletonEntity,
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createInputSystem(network, context);
  createBlockSystem(network, context);
  createPositionSystem(network, context);
  createSyncSystem(network, context);

  // --- AUTORUN --------------------------------------------------------------------
  const interval = setInterval(async () => {
    // Share own position with other players
    const position = noa.entities.getPosition(noa.playerEntity);
    const roundPos = { x: Math.floor(position[0]), y: Math.floor(position[1]), z: Math.floor(position[2]) };
    const peer = peerObject.get();
    if (peer) {
      Object.keys(connections).forEach((connectionId) => {
        if (!isMetadataFilled(connections[connectionId]?.metadata)) return;
        const connection = connections[connectionId]?.connection;
        if (!connection) return;
        connection.send({
          x: roundPos.x,
          y: roundPos.y,
          z: roundPos.z,
        });
      });
    }
  }, 300);
  world.registerDisposer(() => clearInterval(interval));

  return context;
}
