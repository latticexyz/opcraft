import { ecs } from "./boot";
import { Layers } from "./types";
import { Time } from "./utils/time";

declare global {
  interface Window {
    layers?: Partial<Layers>;
    ecs?: typeof ecs;
    time?: Time;
    remountReact?: () => Promise<void>;
    getView?: () => "game" | "map";
    setView?: (view: "game" | "map") => Promise<void>;
  }
}
