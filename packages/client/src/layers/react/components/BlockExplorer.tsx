import { NetworkComponentUpdate } from "@latticexyz/network";
import React from "react";
import { scan } from "rxjs";
import { registerUIComponent } from "../engine";

export function registerBlockExplorer() {
  registerUIComponent(
    "BlockExplorer",
    {
      rowStart: 1,
      rowEnd: 3,
      colStart: 1,
      colEnd: 8,
    },
    (layers) => {
      const {
        network: { ecsEvent$ },
      } = layers;

      // Group stream of component update events by block number
      return ecsEvent$.pipe(
        scan<NetworkComponentUpdate, NetworkComponentUpdate[][]>((acc, curr) => {
          const [prev, ...rest] = acc;
          const prevBlockNumber = (prev && prev[0]?.blockNumber) ?? 0;
          if (curr.blockNumber > prevBlockNumber) {
            return [[curr], ...acc].slice(0, 1);
          }
          return [[curr, ...(prev || [])], ...rest].slice(0, 1);
        }, [])
      );
    },
    (state) => {
      return (
        <div>
          <p>Event</p>
          <>{JSON.stringify(state, undefined, "\n")}</>
        </div>
      );
    }
  );
}
