import styled from "styled-components";
export { BlockIcon } from "./BlockIcon";
export { Slot } from "./Slot";
export { Border } from "./Border";
export { AbsoluteBorder } from "./AbsoluteBorder";
export { Crafting } from "./Crafting";
export { Container, CloseableContainer } from "./Container";
export { Button } from "./Button";
export { LoadingBar } from "./LoadingBar";
export { IconButton } from "./IconButton";
export { Checkbox } from "./Checkbox";

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

export const Gold = styled.span`
  color: #ff0;
`;

export const Red = styled.span`
  color: #eb453b;
`;
export const Title = styled(Gold)`
  text-transform: capitalize;
`;

export const Faded = styled.span`
  opacity: 0.5;
`;

export const Absolute = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
`;

export const Relative = styled.div`
  position: relative;
`;

export const Background = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  position: absolute;
  height: 100%;
  width: 100%;
  pointer-events: all;
`;
