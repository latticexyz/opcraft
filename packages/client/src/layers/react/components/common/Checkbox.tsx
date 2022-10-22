import React from "react";
import styled from "styled-components";
import { IconButton } from "./IconButton";

export const Checkbox: React.FC<{ checked: boolean; setChecked: (checked: boolean) => void }> = ({
  checked,
  setChecked,
}) => {
  return <Box icon={checked ? "checkbox" : "checkbox-on"} onClick={() => setChecked(!checked)} />;
};

const Box = styled(IconButton)``;
