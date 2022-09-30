import { EntityID } from "@latticexyz/recs";
import React from "react";
import styled from "styled-components";
import { BlockIcon } from "./BlockIcon";
import { AbsoluteBorder } from "./AbsoluteBorder";
import { Border } from "./Border";

export const Slot: React.FC<{
  blockID?: EntityID;
  quantity?: number;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}> = ({ blockID, quantity, onClick, selected, disabled }) => (
  <AbsoluteBorder borderColor={selected ? "#ffffff" : "transparent"} borderWidth={6}>
    <Border borderColor={"#b1b1b1"}>
      <Border borderColor={"#797979"}>
        <Border borderColor={"rgb(0 0 0 / 10%)"}>
          <Inner onClick={onClick} disabled={disabled}>
            {blockID ? (
              <BlockIcon blockID={blockID} scale={4}>
                {quantity != null ? <Quantity>{quantity}</Quantity> : null}
              </BlockIcon>
            ) : null}
          </Inner>
        </Border>
      </Border>
    </Border>
  </AbsoluteBorder>
);

const Inner = styled.div<{ disabled?: boolean }>`
  width: 64px;
  height: 64px;
  display: grid;
  justify-items: center;
  align-items: center;
  font-size: 20px;
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
`;

const Quantity = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  justify-content: end;
  align-content: end;
  padding: 7px 3px;
`;
