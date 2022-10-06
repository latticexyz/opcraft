import React from "react";
import styled from "styled-components";
import { Button, Container, Title } from "./common";

export const Balance: React.FC<{ balance: string; address: string }> = ({ balance, address }) => {
  return (
    <BalanceContainer>
      <p>
        <Title>Hello,</Title> {address?.substring(0, 6)}...
      </p>
      <p>Balance: {balance}</p>
      <RequestDripButton onClick={() => console.log("Hello")}>Request drip</RequestDripButton>
    </BalanceContainer>
  );
};

const BalanceContainer = styled(Container)`
  line-height: 1;
  pointer-events: all;
`;

const RequestDripButton = styled(Button)`
  margin-top: 8px;
`;
