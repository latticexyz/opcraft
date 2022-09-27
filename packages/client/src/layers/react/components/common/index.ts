import styled from "styled-components";
import { EntityID } from "@latticexyz/recs";
import { BlockIdToKey } from "../../../network/constants";
import { getBlockIconUrl } from "../../../noa/constants";

export const GUI = styled.div<{ _x: number; _y: number; _height: number; _width: number; scale: number }>`
  height: ${(p) => p._height * p.scale}px;
  width: ${(p) => p._width * p.scale}px;
  background-image: url("/assets/gui/gui.png");
  background-size: ${(p) => 256 * p.scale}px;
  background-position: ${(p) => `${p._x * -p.scale}px ${p._y * -p.scale}px`};
  image-rendering: pixelated;
`;

export const BlockIcon = styled.div<{ blockID: EntityID; scale: number }>`
  width: ${(p) => 16 * p.scale}px;
  height: ${(p) => 16 * p.scale}px;
  margin: ${(p) => 4 * p.scale}px;
  background-image: url("${(p) => getBlockIconUrl(BlockIdToKey[p.blockID]) ?? ""}");
  background-size: 100%;
  image-rendering: pixelated;
  display: grid;
  justify-items: center;
  align-items: center;
  font-size: 20px;
`;

export const Center = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  align-items: center;
  justify-items: center;
`;
