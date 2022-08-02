import { NetworkConfig } from "@latticexyz/network";
import { GameConfig } from "../network/config";
export function getPeerId(networkConfig: NetworkConfig, gameConfig: GameConfig, address: string): string {
  return networkConfig.chainId + "-" + gameConfig.worldAddress + "-" + address;
}
