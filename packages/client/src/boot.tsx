/* eslint-disable @typescript-eslint/no-explicit-any */
import { getComponentValue, removeComponent, setComponent } from "@latticexyz/recs";
import React from "react";
import ReactDOM from "react-dom/client";
import { Time } from "./utils/time";
import { createNetworkLayer as createNetworkLayerImport } from "./layers/network";
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
  chainId: "901",
  worldAddress: "0x687bB6c57915aa2529EfC7D2a26668855e022fAE",
  rpc: "https://l2.op-bedrock.lattice.xyz",
  wsRpc: "wss://l2.op-bedrock.lattice.xyz",
  initialBlockNumber: "589657",
  checkpoint: "https://ecs-snapshot.op-bedrock.lattice.xyz",
  stream: undefined,
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
    const checkpointUrl = params.get("checkpoint") ?? defaultParams.checkpoint;
    const streamServiceUrl = params.get("stream") ?? defaultParams.stream;
    const peerJsUrl = params.get("peerJs") || undefined;
    const devMode = params.get("dev") === "true";
    const initialBlockNumberString = params.get("initialBlockNumber") ?? defaultParams.initialBlockNumber;
    const initialBlockNumber = initialBlockNumberString ? parseInt(initialBlockNumberString) : 0;

    if (!privateKey) {
      privateKey = localStorage.getItem("burnerWallet") || Wallet.createRandom().privateKey;
      localStorage.setItem("burnerWallet", privateKey);
    }

    let networkLayerConfig;
    if (worldAddress && privateKey && chainIdString && jsonRpc) {
      networkLayerConfig = {
        worldAddress,
        privateKey,
        chainId: parseInt(chainIdString),
        jsonRpc,
        peerJsUrl,
        wsRpc,
        checkpointUrl,
        streamServiceUrl,
        devMode,
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

    // Make sure there is only one canvas.
    // Ideally HMR should handle this, but in some cases it fails.
    // If there are two canvas elements, do a full reload.
    // if (document.querySelectorAll("#phaser-game canvas").length > 1) {
    //   console.log("Detected two canvas elements, full reload");
    //   import.meta.hot?.invalidate();
    // }

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
  console.log("booted");

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
