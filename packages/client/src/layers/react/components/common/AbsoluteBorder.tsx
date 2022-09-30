import React from "react";
import styled from "styled-components";

export const AbsoluteBorder: React.FC<{ borderColor: string; borderWidth: number }> = ({
  children,
  borderColor,
  borderWidth,
}) => {
  return (
    <Wrapper>
      <>
        {borderColor !== "transparent" ? <Border borderColor={borderColor} borderWidth={borderWidth} /> : null}
        {children}
      </>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
`;

const Border = styled.div<{ borderColor: string; borderWidth: number }>`
  border: ${(p) => p.borderWidth}px ${(p) => p.borderColor} solid;
  position: absolute;
  width: 100%;
  height: 100%;
  box-sizing: content-box;
  top: -${(p) => p.borderWidth}px;
  left: -${(p) => p.borderWidth}px;
  z-index: 100;
  pointer-events: none;
`;
