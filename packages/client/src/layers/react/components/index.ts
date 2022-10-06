import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerCrosshairs } from "./Crosshairs";
import { registerLoadingState } from "./LoadingState";
import { registerBlockExplorer } from "./BlockExplorer";
import { registerInventory } from "./Inventory";
import { registerBalance } from "./Balance";
import { registerChunkExplorer } from "./ChunkExplorer";
export * from "./common";

export function registerUIComponents() {
  registerLoadingState();
  registerComponentBrowser();
  registerActionQueue();
  registerCrosshairs();
  registerBlockExplorer();
  registerInventory();
  registerBalance();
  registerChunkExplorer();
}
