import React, { useEffect, useState } from "react";
import { registerUIComponent } from "../engine";
import { combineLatest, concat, map, of } from "rxjs";
import styled from "styled-components";
import { Background, Button, Center, Checkbox, Container, Gold, IconButton, Title } from "./common";
import {
  clearLocalCache,
  ComponentValue,
  EntityIndex,
  getComponentEntities,
  getComponentValueStrict,
  SchemaOf,
} from "@latticexyz/recs";
import { sleep } from "@latticexyz/utils";

enum InputMode {
  FILTER,
  REGISTRY,
  PLUGIN,
}

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
      // Setup local state
      const [reloadRequired, setReloadRequired] = useState(false);
      const [input, setInput] = useState("");
      const [mode, setMode] = useState(InputMode.FILTER);

      // Unpack relevant variables
      const {
        components: { Plugin, PluginRegistry },
        api: { addPlugin, reloadPlugin, togglePlugin, addPluginRegistry, reloadPluginRegistryUrl },
        uniqueWorldId,
      } = layers.network;

      const {
        noa,
        api: { togglePlugins },
      } = layers.noa;

      // Setup handler functions
      function handleAddPlugin() {
        try {
          const url = new URL(input);
          addPlugin({ host: url.origin, path: url.pathname, source: url.href, active: false });
          setInput(url.origin + url.pathname);
          setTimeout(() => setMode(InputMode.FILTER), 50);
        } catch (e) {
          console.error(e);
        }
      }

      function handleAddRegistry() {
        try {
          const url = new URL(input);
          console.log(url);
          addPluginRegistry(url.href);
          setInput(url.hostname);
          setTimeout(() => setMode(InputMode.FILTER), 50);
        } catch (e) {
          console.error(e);
        }
      }

      // React to input changes
      useEffect(() => {
        if (input.includes(".js")) {
          setMode(InputMode.PLUGIN);
          return;
        }

        if (input.includes("http")) {
          setMode(InputMode.REGISTRY);
          return;
        }

        setMode(InputMode.FILTER);
      }, [input]);

      // Hide if show is falsy
      if (!show) return null;

      // Compute plugins to show
      const pluginEntities = [...getComponentEntities(Plugin)];

      const pluginData: [EntityIndex, ComponentValue<SchemaOf<typeof Plugin>>][] = pluginEntities.map((entity) => [
        entity,
        getComponentValueStrict(Plugin, entity),
      ]);

      const filteredPluginData =
        mode === InputMode.FILTER
          ? pluginData.filter(
              ([, { host, source, path }]) => host.includes(input) || source.includes(input) || path.includes(input)
            )
          : pluginData;

      const plugins = filteredPluginData.reduce<{ [key: string]: [EntityIndex, string, string, boolean][] }>(
        (acc, curr) => {
          const [entity, value] = curr;
          const { host, path, source, active } = value;
          acc[host] = acc[host] ?? [];
          acc[host].push([entity, path, source, active]);
          acc[host].sort((a, b) => (a[1] > b[1] ? 1 : -1));
          return acc;
        },
        {}
      );

      const sortedPlugins = Object.entries(plugins).sort((a, b) => (a[0] > b[0] ? 1 : -1));

      return (
        <Center>
          <Background onClick={() => togglePlugins(false)} />
          <Wrapper>
            <InputBar
              onFocus={() => (noa.inputs.disabled = true)}
              onBlur={() => (noa.inputs.disabled = false)}
              placeholder={"filter plugins, add registry, or add plugin"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <List>
              <>
                {reloadRequired && (
                  <>
                    <Gold>Reload required to remove plugin.</Gold>
                    <ButtonRow>
                      <PluginButton onClick={() => window.location.reload()}>Reload</PluginButton>
                      <PluginButton
                        onClick={async () => {
                          clearLocalCache(Plugin, uniqueWorldId);
                          clearLocalCache(PluginRegistry, uniqueWorldId);
                          await sleep(200);
                          window.location.reload();
                        }}
                      >
                        Hard Reload
                      </PluginButton>
                    </ButtonRow>
                  </>
                )}
                {mode === InputMode.PLUGIN && <PluginButton onClick={handleAddPlugin}>Add plugin</PluginButton>}
                {mode === InputMode.REGISTRY && (
                  <PluginButton onClick={handleAddRegistry}>Add plugin registry</PluginButton>
                )}
                {sortedPlugins.map(([host, ps], index) => {
                  return (
                    <RegistryList key={"registry" + host + index}>
                      <PluginHeadlineRow>
                        <PluginHeadline href={ps[0]?.[2]} target="_blank">
                          {host}
                        </PluginHeadline>
                        <IconButton onClick={() => reloadPluginRegistryUrl(host)} icon={"reload"} />
                      </PluginHeadlineRow>
                      {ps.map(([entity, path, source, active], index) => {
                        return (
                          <PluginContainer key={"plugin/" + host + path + index}>
                            <Checkbox
                              checked={active}
                              setChecked={(checked) => {
                                togglePlugin(entity, checked);
                                setReloadRequired(reloadRequired || !checked);
                              }}
                            />
                            <IconButton onClick={() => reloadPlugin(entity)} icon={"reload"} />
                            <IconButton onClick={() => window.open(source)} icon={"code"} />
                            <PluginName>{path.split(".")[0]?.replace("/", "")}</PluginName>
                          </PluginContainer>
                        );
                      })}
                    </RegistryList>
                  );
                })}
              </>
            </List>
          </Wrapper>
        </Center>
      );
    }
  );
}

const Wrapper = styled.div`
  pointer-events: all;
  z-index: 1000;
`;

const InputBar = styled.input`
  padding: 20px;
  width: 400px;
  border-radius: 3px;
  border: none;
  box-shadow: 0 0 0 3px #555, 0 0 0 5px #000;
  font-family: "Lattice Pixel";
  font-size: 18px;
  outline: none;
`;

const PluginContainer = styled.div`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: start;
  grid-gap: 5px;
`;

const List = styled(Container)`
  margin: 0;
  display: grid;
  grid-gap: 15px;
  max-height: 400px;
  overflow: auto;
  padding: 20px 20px 10px 20px;
`;

const RegistryList = styled.div`
  display: grid;
  grid-gap: 10px;
  padding-bottom: 10px;
`;

const PluginButton = styled(Button)`
  padding: 10px;
`;

const ButtonRow = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 1fr 1fr;
`;

const PluginHeadline = styled.a`
  color: #7f7f7f;
  font-size: 16px;
  text-decoration: none;
`;

const PluginName = styled.p`
  font-size: 18px;
`;

const PluginHeadlineRow = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 10px;
  align-items: center;
  justify-content: start;
`;
