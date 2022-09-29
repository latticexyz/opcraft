import styled from "styled-components";

export const Border = styled.div<{ color: string }>`
  border: 3px ${(p) => p.color} solid;
`;
