import { createEntity, defineComponentSystem, getEntitiesWithValue, withValue } from "@latticexyz/recs";
import { NetworkLayer } from "../types";

export function createPluginSystem(context: NetworkLayer) {
  const {
    world,
    components: { Plugin, PluginRegistry },
  } = context;

  // Load plugins from registries
  defineComponentSystem(world, PluginRegistry, async ({ value }) => {
    const host = value[0]?.value;
    if (!host) return;

    try {
      const result = await fetch(host + "/index.json");
      const paths = await result.json();
      for (const path of paths) {
        const exists = getEntitiesWithValue(Plugin, { host, path }).size > 0;
        if (!exists) createEntity(world, [withValue(Plugin, { host, path, active: false })]);
      }
    } catch (e) {
      console.warn(e);
    }
  });

  // Inject and remove plugin scripts
  defineComponentSystem(world, Plugin, (update) => {
    const [current] = update.value;
    const id = "plugintag/" + update.entity;

    // Remove the plugin script if it got disabled
    if (!current || !current.active) {
      return document.getElementById(id)?.remove();
    }

    // Inject the plugin script if it got enabled
    const script = document.createElement("script");
    script.id = id;
    script.src = current.host + current.path;
    document.head.appendChild(script);
  });
}
