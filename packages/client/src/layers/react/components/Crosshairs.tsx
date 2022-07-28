import React from "react";
import { registerUIComponent } from "../engine";
import { of } from "rxjs";
import styled from "styled-components";

export function registerCrosshairs() {
  registerUIComponent(
    "Crosshairs",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    () => of(1),
    () => {
      return <Cross>+</Cross>;
    }
  );
}

const Cross = styled.div`
  height: 100%;
  width: 100%;
  display: grid;
  align-items: center;
  justify-items: center;
  pointer-events: none;
  font-size: 20px;
`;
