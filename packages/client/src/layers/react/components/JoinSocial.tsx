import React from "react";
import styled from "styled-components";
import { Button, CloseableContainer, Gold } from "./common";

export const JoinSocial: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <SocialContainer onClose={onClose}>
      <p>
        <Gold>Join the community!</Gold>
      </p>
      <Buttons>
        <Button onClick={() => window.open("https://discord.gg/XhZp6HbqNp", "blank")}>Discord</Button>
        <Button onClick={() => window.open("https://twitter.com/latticexyz", "blank")}>Twitter</Button>
      </Buttons>
    </SocialContainer>
  );
};

const SocialContainer = styled(CloseableContainer)`
  line-height: 1;
  pointer-events: all;
  min-width: 200px;
`;

const Buttons = styled.div`
  margin-top: 8px;
  display: grid;
  grid-gap: 9px;
  grid-auto-flow: column;
`;
