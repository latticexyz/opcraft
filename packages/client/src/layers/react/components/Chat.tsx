import React from "react";
import { registerUIComponent } from "../engine";
import { filter, map, of, scan } from "rxjs";
import styled from "styled-components";
import { getComponentValue } from "@latticexyz/recs";
import { formatEntityID } from "@latticexyz/network";

export function registerChat() {
  registerUIComponent(
    "Chat",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      const indicator = encoder.encode("m")[0];
      const {
        relay,
        components: { Name },
        world,
      } = layers.network;
      if (!relay) return of(null);
      const messages = relay.event$.pipe(
        filter((e) => e.message.data[0] === indicator),
        map(({ address, message }) => {
          const entityIndex = world.entityToIndex.get(formatEntityID(address));
          return {
            name: (entityIndex != null && getComponentValue(Name, entityIndex)?.value) || address.substring(0, 10),
            message: decoder.decode(message.data.subarray(1)),
          };
        }),
        scan<
          {
            message: string;
            name: string;
          },
          {
            message: string;
            name: string;
          }[]
        >((acc, curr) => [...acc.slice(-9), curr], []),
        map((props) => ({ props }))
      );
      return messages;
    },
    ({ props }) => {
      return (
        <Wrapper>
          {props.map(({ name, message }) => (
            <p>
              {name}: {message}
            </p>
          ))}
        </Wrapper>
      );
    }
  );
}

const Wrapper = styled.div`
  height: 100%;
  width: 100px;
  display: grid;
  align-content: start;
  justify-start: start;
  font-size: 15px;
  pointer-events: all;
`;
