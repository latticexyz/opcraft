import { ActionState } from "@latticexyz/std-client";
import React from "react";
import styled, { ThemedStyledFunction } from "styled-components";
import { ActionStatusIcon } from "../Action";

export const Container = styled.div`
  box-shadow: 0 0 0 3px #555, 0 0 0 5px #000;
  background: #222;
  margin: 5px;
  border-radius: 3px;
  padding: 8px;
`;

export const CloseableContainer: React.FC<
  { onClose: () => void } & Partial<ThemedStyledFunction<"div", any, {}, never>>
> = ({ onClose, children, ...props }) => {
  return (
    <RelativeContainer {...props}>
      <CloseButton onClick={onClose}>
        <ActionStatusIcon state={ActionState.Failed} />
      </CloseButton>
      <>{children}</>
    </RelativeContainer>
  );
};

const RelativeContainer = styled(Container)`
  position: relative;
`;

const CloseButton = styled.div`
  position: absolute;
  right: 3px;
  top: 3px;
  cursor: pointer;

  svg {
    width: 1em;
    height: 1em;
    color: #9c9c9c;

    :hover {
      color: hsl(0, 60%, 60%);
    }
  }
`;
