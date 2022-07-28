import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerCrosshairs } from "./Crosshairs";
import { registerActionBar } from "./ActionBar";
import { registerCrafting } from "./Crafting";

export function registerUIComponents() {
  registerComponentBrowser();
  registerActionQueue();
  registerCrosshairs();
  registerActionBar();
  registerCrafting();
}
