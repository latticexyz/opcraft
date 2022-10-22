import { BlockType } from "./constants";
import { createNetworkLayer } from "./createNetworkLayer";

export type NetworkLayer = Awaited<ReturnType<typeof createNetworkLayer>>;

export type Structure = (typeof BlockType[keyof typeof BlockType] | undefined)[][][];

export type PluginRegistrySpec = {
  source: string;
  plugins: string[];
};
