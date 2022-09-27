import React from "react";
import { registerUIComponent } from "../engine";
import { concat, map, of } from "rxjs";
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
    (layers) =>
      concat(of(1), layers.noa.components.UI.update$.pipe(map((e) => (e.value[0]?.showInventory ? null : true)))),
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
