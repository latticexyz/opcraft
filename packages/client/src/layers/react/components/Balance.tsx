import { Signer } from "ethers";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Container, Relative, Title } from "./common";
import { ecoji } from "../../../utils/ecoji";
import { FaucetServiceClient } from "@latticexyz/services/protobuf/ts/faucet/faucet";
import { formatEther } from "ethers/lib/utils";
import { ActionState } from "@latticexyz/std-client";
import { ActionStatusIcon } from "./Action";

const DEFAULT_TEXT = "autonomous worlds await... ";
const TWITTER_URL = "https://twitter.com/intent/tweet?text=";
const SIGNATURE_TEXT = (handle: string, address: string) => `${handle} tweetooor requesting drip to ${address} address`;

export const Balance: React.FC<{
  address: string;
  faucet?: FaucetServiceClient;
  signer: Signer;
}> = ({ address, faucet, signer }) => {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [timeToDrip, setTimeToDrip] = useState(0);
  const [username, setUsername] = useState("");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState<ActionState | undefined>();

  async function onRequestDrip() {
    if (timeToDrip <= 0) {
      if (locked && username) requestDrip();
      else setOpen(true);
    }
  }

  async function updateBalance() {
    const balance = await signer.getBalance();
    const eth = formatEther(balance).split(".");
    setBalance(eth[0] + (eth.length > 1 ? "." + eth[1].substring(0, 5) : ""));
  }

  async function updateTimeUntilDrip(username: string) {
    const r = await faucet?.timeUntilDrip({ address, username });
    if (r) setTimeToDrip(Math.ceil(r.timeUntilDripMinutes * 60 + r.timeUntilDripSeconds));
  }

  // Update balance in regular intervals
  useEffect(() => {
    updateBalance();
    const interval = setInterval(updateBalance, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch the tile until next drip once
  useEffect(() => {
    (async () => {
      const { username: linkedUsername } = (await faucet?.getLinkedTwitterForAddress({ address })) || {};
      if (linkedUsername) {
        setUsername(linkedUsername);
        updateTimeUntilDrip(linkedUsername);
        setLocked(true);
      }
    })();
  }, []);

  // Decrease the time until next drip once per second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeToDrip((ttd) => ttd - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function tweet() {
    if (!faucet || !username) return;
    const signature = ecoji.encode(await signer.signMessage(SIGNATURE_TEXT(username, address)));
    const text = encodeURIComponent(DEFAULT_TEXT + signature);
    window.open(TWITTER_URL + text);
  }

  async function requestDrip() {
    if (!faucet || !username) return;
    const usernameAddressPair = { username, address };
    setStatus(ActionState.Executing);
    try {
      if (locked) {
        console.log("Locked", username);
        await faucet.drip(usernameAddressPair);
      } else {
        console.log("Unlocked", username);
        await faucet.dripVerifyTweet(usernameAddressPair);
      }
      await updateBalance();
      setLocked(true);
      setStatus(ActionState.Complete);
    } catch (e) {
      console.warn("Faucet:", e);
      setStatus(ActionState.Failed);
    }
    setTimeout(() => {
      setOpen(false);
      setStatus(undefined);
    }, 300);
    updateTimeUntilDrip(username);
  }

  const TwitterBox = (
    <Relative>
      <InputBefore>@</InputBefore>
      <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      <Buttons>
        <TwitterButton disabled={!username} onClick={tweet}>
          1. Tweet
        </TwitterButton>
        <TwitterButton disabled={!username} onClick={requestDrip}>
          {status ? <ActionStatusIcon state={status} /> : "2. Verify"}
        </TwitterButton>
      </Buttons>
    </Relative>
  );

  return (
    <>
      <BalanceContainer>
        <p>
          <Title>Hello,</Title> {address?.substring(0, 6)}...
        </p>
        <p>Balance: {balance} ETH</p>
        {open ? TwitterBox : null}
        {faucet && (
          <TwitterButton disabled={!open && timeToDrip > 0} onClick={onRequestDrip}>
            {open ? (
              "Cancel"
            ) : timeToDrip > 0 ? (
              `${String(Math.floor(timeToDrip / 60)).padStart(2, "0")}:${String(timeToDrip % 60).padStart(
                2,
                "0"
              )} till next drip`
            ) : status ? (
              <ActionStatusIcon state={status} />
            ) : (
              "Request drip"
            )}
          </TwitterButton>
        )}
      </BalanceContainer>
    </>
  );
};

const BalanceContainer = styled(Container)`
  line-height: 1;
  pointer-events: all;

  .ActionStatus--spin {
    animation: spin 1s linear infinite;
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  }
  .ActionStatus--gray {
    color: hsl(0, 0%, 60%);
  }
  .ActionStatus--red {
    color: hsl(0, 60%, 60%);
  }
  .ActionStatus--green {
    color: hsl(120, 60%, 60%);
  }
`;

const TwitterButton = styled(Button)`
  margin-top: 8px;
  height: 24px;
  overflow: hidden;
`;

const InputBefore = styled.span`
  position: absolute;
  top: 20px;
  left: 6px;
  color: #919191;
  text-shadow: 1.5px 1.5px 0 #e8e8e8;
`;

const Input = styled.input`
  width: 100%;
  padding: 6px 6px 6px 18px;
  border-radius: 3px;
  border: none;
  box-shadow: 0 0 0 3px #555555;
  background-color: #fff;
  font-size: 1rem;
  font-family: "Lattice Pixel";
  text-shadow: 1.5px 1.5px 0 #e2e2e2;
  margin: 15px 0 0px 0;
`;

const Buttons = styled.div`
  display: grid;
  grid-gap: 9px;
  grid-template-columns: 1fr 1fr;
`;
