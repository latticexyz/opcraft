import styled from "styled-components";

export const IconButton = styled.div<{ icon: string }>`
  background-color: rgb(0 0 0 / 30%);
  height: 20px;
  width: 20px;
  background-size: contain;
  background-position: center;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
  transition: all 200ms ease;
  background-image: url(/ui/${(p) => p.icon}.svg);

  :hover {
    background-color: rgb(0 0 0 / 70%);
  }

  :active {
    background-color: rgb(255 255 255 / 10%);
  }
`;
