import { createEntity, defineComponentSystem, getEntitiesWithValue, withValue } from "@latticexyz/recs";
import { NetworkLayer, PluginRegistrySpec } from "../types";

export function createPluginSystem(context: NetworkLayer) {
  const {
    world,
    components: { Plugin, PluginRegistry },
    api: { addPlugin },
  } = context;

  // Load plugins from registries
  defineComponentSystem(world, PluginRegistry, async ({ value }) => {
    const host = value[0]?.value;
    if (!host) return;

    try {
      const result = await fetch(host + "/index.json");
      const { source, plugins } = (await result.json()) as PluginRegistrySpec;
      console.log(plugins);
      for (const path of plugins) {
        addPlugin({ host, source, path, active: false });
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
