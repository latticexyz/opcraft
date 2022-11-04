import { ActionState } from "@latticexyz/std-client";
import React from "react";
import styled, { ThemedStyledFunction } from "styled-components";
import { ActionStatusIcon } from "../Action";
import { Container } from "./Container";

export const CloseableContainer: React.FC<
  { onClose: () => void } & Partial<ThemedStyledFunction<"div", any, any, never>>
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
