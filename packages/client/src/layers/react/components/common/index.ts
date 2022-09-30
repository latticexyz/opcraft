import styled from "styled-components";
export { BlockIcon } from "./BlockIcon";
export { Slot } from "./Slot";
export { Border } from "./Border";
export { AbsoluteBorder } from "./AbsoluteBorder";

export const GUI = styled.div<{ _x: number; _y: number; _height: number; _width: number; scale: number }>`
  height: ${(p) => p._height * p.scale}px;
  width: ${(p) => p._width * p.scale}px;
  background-image: url("/assets/gui/gui.png");
  background-size: ${(p) => 256 * p.scale}px;
  background-position: ${(p) => `${p._x * -p.scale}px ${p._y * -p.scale}px`};
  image-rendering: pixelated;
`;

export const Center = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  align-items: center;
  justify-items: center;
`;
