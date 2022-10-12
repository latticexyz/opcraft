/* eslint-disable @typescript-eslint/no-explicit-any */
import { getComponentValue, removeComponent, setComponent } from "@latticexyz/recs";
import React from "react";
import ReactDOM from "react-dom/client";
import { Time } from "./utils/time";
import { createNetworkLayer as createNetworkLayerImport, GameConfig } from "./layers/network";
import { createNoaLayer as createNoaLayerImport } from "./layers/noa";
import { Layers } from "./types";
import { Engine as EngineImport } from "./layers/react/engine/Engine";
import { registerUIComponents as registerUIComponentsImport } from "./layers/react/components";
import { Wallet } from "ethers";
import { enableLogger } from "@latticexyz/utils";

enableLogger();

// Assign variables that can be overridden by HMR
let createNetworkLayer = createNetworkLayerImport;
let createNoaLayer = createNoaLayerImport;
let registerUIComponents = registerUIComponentsImport;
let Engine = EngineImport;

const defaultParams = {
  chainId: "64657",
  worldAddress: "0x3031a86EFA3A9c0B41EA089F2021C6490591fB8c",
  rpc: "https://opcraft-3-replica-0.bedrock-goerli.optimism.io",
  wsRpc: "wss://opcraft-3-replica-0.bedrock-goerli.optimism.io/ws",
  initialBlockNumber: "4146",
  snapshot: "https://ecs-snapshot.opcraft-mud-services.lattice.xyz",
  stream: "https://ecs-stream.opcraft-mud-services.lattice.xyz",
  relay: "https://ecs-relay.opcraft-mud-services.lattice.xyz",
  faucet: "https://faucet.opcraft-mud-services.lattice.xyz",
  blockTime: "1000",
};

/**
 * This function is called once when the game boots up.
 * It creates all the layers and their hierarchy.
 * Add new layers here.
 */
async function bootGame() {
  const layers: Partial<Layers> = {};
  let initialBoot = true;

  async function rebootGame(): Promise<Layers> {
    const params = new URLSearchParams(window.location.search);
    const worldAddress = params.get("worldAddress") ?? defaultParams.worldAddress;
    let privateKey = params.get("burnerWalletPrivateKey");
    const chainIdString = params.get("chainId") ?? defaultParams.chainId;
    const jsonRpc = params.get("rpc") ?? defaultParams.rpc;
    const wsRpc = params.get("wsRpc") ?? defaultParams.wsRpc; // || (jsonRpc && jsonRpc.replace("http", "ws"));
    const snapshotUrl = params.get("snapshot") ?? defaultParams.snapshot;
    const streamServiceUrl = params.get("stream") ?? defaultParams.stream;
    const relayServiceUrl = params.get("relay") ?? defaultParams.relay;
    const faucetServiceUrl = params.get("faucet") ?? defaultParams.faucet;
    const devMode = params.get("dev") === "true";
    const initialBlockNumberString = params.get("initialBlockNumber") ?? defaultParams.initialBlockNumber;
    const initialBlockNumber = initialBlockNumberString ? parseInt(initialBlockNumberString) : 0;
    const blockTimeString = params.get("blockTime") ?? defaultParams.blockTime;
    const blockTime = blockTimeString ? parseInt(blockTimeString) : 1000;

    if (!privateKey) {
      privateKey = localStorage.getItem("burnerWallet") || Wallet.createRandom().privateKey;
      localStorage.setItem("burnerWallet", privateKey);
    }

    let networkLayerConfig: GameConfig | undefined;
    if (worldAddress && privateKey && chainIdString && jsonRpc) {
      networkLayerConfig = {
        worldAddress,
        privateKey,
        chainId: parseInt(chainIdString),
        jsonRpc,
        wsRpc,
        snapshotUrl,
        streamServiceUrl,
        relayServiceUrl,
        faucetServiceUrl,
        devMode,
        blockTime,
        initialBlockNumber,
      };
    }

    if (!networkLayerConfig) throw new Error("Invalid config");

    if (!layers.network) layers.network = await createNetworkLayer(networkLayerConfig);
    if (!layers.noa) layers.noa = await createNoaLayer(layers.network);

    Time.time.setPacemaker((setTimestamp) => {
      setInterval(() => {
        setTimestamp(Date.now());
      }, 100);
    });

    // Start syncing once all systems have booted
    if (initialBoot) {
      initialBoot = false;
      layers.network.startSync();
    }

    // Remount react when rebooting layers
    mountReact.current(false);
    mountReact.current(true);

    return layers as Layers;
  }

  function dispose(layer: keyof Layers) {
    layers[layer]?.world.dispose();
    layers[layer] = undefined;
  }

  await rebootGame();

  const ecs = {
    setComponent,
    removeComponent,
    getComponentValue,
  };

  (window as any).layers = layers;
  (window as any).ecs = ecs;
  (window as any).time = Time.time;

  let reloadingNetwork = false;
  let reloadingNoa = false;

  if (import.meta.hot) {
    import.meta.hot.accept("./layers/network/index.ts", async (module) => {
      if (reloadingNetwork) return;
      reloadingNetwork = true;
      createNetworkLayer = module.createNetworkLayer;
      dispose("network");
      dispose("noa");
      await rebootGame();
      console.log("HMR Network");
      layers.network?.startSync();
      reloadingNetwork = false;
    });

    import.meta.hot.accept("./layers/noa/index.ts", async (module) => {
      if (reloadingNoa) return;
      reloadingNoa = true;
      createNoaLayer = module.createNoaLayer;
      dispose("noa");
      document.getElementById("noa_fps")?.remove();
      document.getElementById("noa-container")?.remove();
      await rebootGame();
      console.log("HMR Noa");
      reloadingNoa = false;
    });
  }
  console.log("[Global] OPCraft booted");

  return { layers, ecs };
}

const mountReact: { current: (mount: boolean) => void } = { current: () => void 0 };
const setLayers: { current: (layers: Layers) => void } = { current: () => void 0 };

function bootReact() {
  const rootElement = document.getElementById("react-root");
  if (!rootElement) return console.warn("React root not found");

  const root = ReactDOM.createRoot(rootElement);

  function renderEngine() {
    root.render(<Engine setLayers={setLayers} mountReact={mountReact} />);
  }

  renderEngine();
  registerUIComponents();

  if (import.meta.hot) {
    // HMR React engine
    import.meta.hot.accept("./layers/react/engine/Engine.tsx", async (module) => {
      Engine = module.Engine;
      renderEngine();
    });
  }

  if (import.meta.hot) {
    // HMR React components
    import.meta.hot.accept("./layers/react/components/index.ts", async (module) => {
      registerUIComponents = module.registerUIComponents;
      registerUIComponents();
    });
  }
}

export async function boot() {
  bootReact();
  const game = await bootGame();
  setLayers.current(game.layers as Layers);
}
