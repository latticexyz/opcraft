import React from "react";
import { registerUIComponent } from "../engine";
import { concat, interval, map, of } from "rxjs";
import styled from "styled-components";
import { utils } from "ethers";
import { awaitPromise } from "@latticexyz/utils";

export function registerBalance() {
  registerUIComponent(
    "Balance",
    {
      rowStart: 1,
      rowEnd: 2,
      colStart: 8,
      colEnd: 12,
    },
    ({
      network: {
        network: { signer, connectedAddress },
      },
    }) => {
      return concat(of(0), interval(5000)).pipe(
        map(async () => {
          const balance = (await signer.get()?.getBalance()) ?? 0;
          return utils.formatEther(balance);
        }),
        awaitPromise(),
        map((balance) => ({ balance, address: connectedAddress.get() }))
      );
    },
    ({ balance, address }) => {
      return (
        <Wrapper>
          address: {address} / balance: {balance}
        </Wrapper>
      );
    }
  );
}

const Wrapper = styled.div``;
