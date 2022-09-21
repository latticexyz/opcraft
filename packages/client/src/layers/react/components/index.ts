// import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerCrosshairs } from "./Crosshairs";
import { registerActionBar } from "./ActionBar";
import { registerCrafting } from "./Crafting";
import { registerLoadingState } from "./LoadingState";

export function registerUIComponents() {
  registerLoadingState();
  // registerComponentBrowser();
  registerActionQueue();
  registerCrosshairs();
  registerActionBar();
  registerCrafting();
}
