import React from "react";
import styled from "styled-components";
import { CloseableContainer } from "./common";

export const Hint: React.FC<{ onClose: () => void }> = ({ onClose, children }) => {
  return (
    <HintContainer onClose={onClose}>
      <>{children}</>
    </HintContainer>
  );
};

const HintContainer = styled(CloseableContainer)`
  line-height: 1;
  pointer-events: all;
  padding-right: 23px;
  max-width: 200px;
`;
