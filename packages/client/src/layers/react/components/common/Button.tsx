import styled from "styled-components";

export const Button = styled.button`
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;

  box-shadow: 0 0 0 3px #555;
  background: #333;
  padding: 4px;
  border: 0;
  border-radius: 3px;
  transition: all 100ms ease;
  user-select: none;
  text-align: center;

  :disabled {
    opacity: 0.5;
  }
  :enabled {
    cursor: pointer;
  }

  :enabled:hover {
    box-shadow: 0 0 0 3px #555, 0 0 0 5px #000;
    background: #777;
  }

  :enabled:active {
    box-shadow: 0 0 0 3px #555, 0 0 0 5px #000;
    background: #666;
  }
`;

Button.defaultProps = {
  type: "button",
};
