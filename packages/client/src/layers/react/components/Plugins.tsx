import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import { combineLatest, concat, map, of } from "rxjs";
import styled from "styled-components";
import { Center } from "./common";
import { clearLocalCache, getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { sleep } from "@latticexyz/utils";

export function registerPlugins() {
  registerUIComponent(
    "Plugins",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const { Plugin } = layers.network.components;
      const show$ = concat(of(false), layers.noa.components.UI.update$.pipe(map((e) => e.value[0]?.showPlugins)));
      const plugin$ = concat(of(1), Plugin.update$);
      return combineLatest([show$, of(layers), plugin$]).pipe(map((props) => ({ props })));
    },
    ({ props: [show, layers] }) => {
      const [reloadRequired, setReloadRequired] = useState(false);
      if (!show) return null;

      const {
        components: { Plugin, PluginRegistry },
        api: { reloadPlugin, togglePlugin },
        uniqueWorldId,
      } = layers.network;

      const plugins = [...getComponentEntities(Plugin)];

      return (
        <Center>
          <Container>
            {plugins.map((p) => {
              const { active, path } = getComponentValueStrict(Plugin, p);
              return (
                <div key={"plugin/" + p}>
                  <input
                    checked={active}
                    type="checkbox"
                    onChange={(e) => {
                      togglePlugin(p, e.target.checked);
                      setReloadRequired(reloadRequired || !e.target.checked);
                    }}
                  />
                  <p>{path}</p>
                  <button onClick={() => reloadPlugin(p)}>reload</button>
                </div>
              );
            })}
            {reloadRequired && <button onClick={() => window.location.reload()}>Page reload required</button>}
            {
              <button
                onClick={async () => {
                  clearLocalCache(Plugin, uniqueWorldId);
                  clearLocalCache(PluginRegistry, uniqueWorldId);
                  await sleep(200);
                  window.location.reload();
                }}
              >
                Empty component cache and reload
              </button>
            }
          </Container>
        </Center>
      );
    }
  );
}

const Container = styled.div`
  height: 200px;
  width: 200px;
  background-color: white;
  pointer-events: all;
`;

const Input = styled.input``;
const Button = styled.button``;
