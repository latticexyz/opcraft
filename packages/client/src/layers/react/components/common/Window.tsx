import React from "react";
import styled from "styled-components";
import Draggable from "react-draggable";
import { Container } from "./Container";

export const Window: React.FC = ({ children }) => {
  return (
    <Draggable handle=".handle">
      <Wrapper>
        <Handlebar className="handle">=</Handlebar>
        <>{children}</>
      </Wrapper>
    </Draggable>
  );
};

const Wrapper = styled(Container)`
  pointer-events: all;
  min-width: 100px;
  position: relative;
  padding-top: 10px;
  height: 100px;
`;

const Handlebar = styled.div`
  width: 100%;
  height: 15px;
  background-color: #333333;
  position: absolute;
  top: 0;
  left: 0;
  cursor: grab;
  border-radius: 3px;
  display: grid;
  align-items: center;
  justify-items: center;
  font-size: 15px;
  color: #555555;

  :active {
    cursor: grabbing;
  }
`;
