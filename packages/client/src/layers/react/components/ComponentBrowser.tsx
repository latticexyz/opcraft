import React from "react";
import { Browser } from "@latticexyz/ecs-browser";
import { registerUIComponent } from "../engine";
import { map } from "rxjs";
export function registerComponentBrowser() {
  registerUIComponent(
    "ComponentBrowser",
    {
      colStart: 10,
      colEnd: 13,
      rowStart: 1,
      rowEnd: 13,
    },
    (layers) => layers.noa.components.UI.update$.pipe(map((e) => ({ layers, show: e.value[0]?.showComponentBrowser }))),
    ({ layers, show }) => {
      const {
        network: { world, dev },
      } = layers;
      return show ? (
        <Browser
          world={world}
          entities={world.entities}
          layers={layers}
          devHighlightComponent={dev.DevHighlightComponent}
          hoverHighlightComponent={dev.HoverHighlightComponent}
          setContractComponentValue={dev.setContractComponentValue}
        />
      ) : null;
    }
  );
}
