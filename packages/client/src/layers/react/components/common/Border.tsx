import styled from "styled-components";

export const Border = styled.div<{ borderColor: string }>`
  border: 3px ${(p) => p.borderColor} solid;
`;
