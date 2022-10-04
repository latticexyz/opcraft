import { SetupContractConfig } from "@latticexyz/std-client";

export type GameConfig = {
  worldAddress: string;
  privateKey: string;
  chainId: number;
  jsonRpc: string;
  wsRpc?: string;
  snapshotUrl?: string;
  streamServiceUrl?: string;
  relayServiceUrl?: string;
  faucetServiceUrl?: string;
  devMode: boolean;
  initialBlockNumber: number;
  blockTime: number;
};

export const getNetworkConfig: (networkConfig: GameConfig) => SetupContractConfig = (config) => ({
  clock: {
    period: config.blockTime,
    initialTime: 0,
    syncInterval: 60_000,
  },
  provider: {
    chainId: config.chainId,
    jsonRpcUrl: config.jsonRpc,
    wsRpcUrl: config.wsRpc,
    options: {
      batch: false,
      pollingInterval: 1000,
    },
  },
  privateKey: config.privateKey,
  chainId: config.chainId,
  snapshotServiceUrl: config.snapshotUrl,
  streamServiceUrl: config.streamServiceUrl,
  relayServiceUrl: config.relayServiceUrl,
  initialBlockNumber: config.initialBlockNumber,
  worldAddress: config.worldAddress,
  devMode: config.devMode,
});
