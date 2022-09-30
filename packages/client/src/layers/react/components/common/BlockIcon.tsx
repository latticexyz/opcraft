import { EntityID } from "@latticexyz/recs";
import styled from "styled-components";
import { BlockIdToKey } from "../../../network/constants";
import { getBlockIconUrl } from "../../../noa/constants";

export const BlockIcon = styled.div<{ blockID: EntityID; scale: number }>`
  width: ${(p) => 16 * p.scale}px;
  height: ${(p) => 16 * p.scale}px;
  background-image: url("${(p) => getBlockIconUrl(BlockIdToKey[p.blockID]) ?? ""}");
  background-size: 100%;
  image-rendering: pixelated;
  display: grid;
  justify-items: center;
  align-items: center;
  font-size: 20px;
`;
