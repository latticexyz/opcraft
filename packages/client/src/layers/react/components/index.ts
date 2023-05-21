import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerCrosshairs } from "./Crosshairs";
import { registerLoadingState } from "./LoadingState";
import { registerBlockExplorer } from "./BlockExplorer";
import { registerInventory } from "./Inventory";
import { registerSidebar } from "./Sidebar";
import { registerPlugins } from "./Plugins";
import { registerToast } from "./Toast";
export * from "./common";

export function registerUIComponents() {
  registerLoadingState();
  registerActionQueue();
  registerCrosshairs();
  registerToast();
  registerBlockExplorer();
  registerInventory();
  registerSidebar();
  registerComponentBrowser();
  registerPlugins();
}
