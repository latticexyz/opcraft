import React, { useEffect, useState } from "react";
import styled from "styled-components";

export const BootScreen: React.FC<{ initialOpacity?: number }> = ({ children, initialOpacity }) => {
  const [opacity, setOpacity] = useState(initialOpacity ?? 0);

  useEffect(() => setOpacity(1), []);

  return (
    <Container>
      <img src="/img/opcraft-light.png" style={{ opacity, width: 300 }}></img>
      <div>
        <>{children || <>&nbsp;</>}</>
      </div>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: rgb(0 0 0 / 100%);
  display: grid;
  align-content: center;
  align-items: center;
  justify-content: center;
  justify-items: center;
  transition: all 2s ease;
  grid-gap: 50px;
  z-index: 100;
  pointer-events: none;

  div {
    font-family: "Lattice Pixel", sans-serif;
  }

  img {
    transition: all 2s ease;
    width: 100px;
  }
`;
