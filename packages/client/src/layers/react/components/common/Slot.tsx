import { EntityID } from "@latticexyz/recs";
import React from "react";
import styled from "styled-components";
import { BlockIcon } from "./BlockIcon";
import { Border } from "./Border";

export const Slot: React.FC<{
  blockID?: EntityID;
  quantity?: number;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}> = ({ blockID, quantity, onClick, selected, disabled }) => (
  <Border color={selected ? "green" : "lightgray"}>
    <Border color={"#999999"}>
      <Inner onClick={onClick} disabled={disabled}>
        {blockID ? (
          <BlockIcon blockID={blockID} scale={3.6}>
            {quantity != null ? <Quantity>{quantity}</Quantity> : null}
          </BlockIcon>
        ) : null}
      </Inner>
    </Border>
  </Border>
);

const Inner = styled.div<{ disabled?: boolean }>`
  width: 64px;
  height: 64px;
  display: grid;
  justify-items: center;
  align-items: center;
  font-size: 20px;
  border: 3px #626262 solid;
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
