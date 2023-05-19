import React from "react";
import styled from "styled-components";
import { Button, CloseableContainer, Gold } from "./common";
import {Layers} from "../../../types";
import {TransitionRuleStruct} from "contracts/types/ethers-contracts/RegisterVoxelTypeSystem";


const createTransitionRule = (lookForType:string, changeToType:string):TransitionRuleStruct => {
	return {
		lookForType: lookForType,
		changeToType: changeToType,
	}
}

export const ImportVoxel: React.FC<{ onClose: () => void; layers: Layers}> = ({ onClose, layers }) => {
	const {
		network: {
			api,
		},
	} = layers;

	const registerVoxel = () => {
		console.log("register voxel");
		api.registerVoxelType("test", [createTransitionRule("test1", "test2")], "#003300");
	}

	return (
		<ImportContainer onClose={onClose}>
			<p>
				<Gold>Import Voxel</Gold>
			</p>
			<Buttons>
				<Button onClick={registerVoxel}>Register Voxel</Button>
			</Buttons>
		</ImportContainer>
	);
};

const ImportContainer = styled(CloseableContainer)`
  line-height: 1;
  pointer-events: all;
  min-width: 200px;
`;

const Buttons = styled.div`
  margin-top: 8px;
  display: grid;
  grid-gap: 9px;
  grid-auto-flow: column;
`;