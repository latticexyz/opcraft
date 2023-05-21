import React from "react";
import styled from "styled-components";
import { Button, CloseableContainer, Gold } from "./common";
import {Layers} from "../../../types";
import {VoxelCoord} from "@latticexyz/utils";
import {getComponentValue} from "@latticexyz/recs";
import {toast} from "react-toastify";

export const RegisterCreation: React.FC<{ onClose: () => void; layers: Layers}> = ({ onClose, layers }) => {
	const {
		network: {
			api,
		},
		noa: {
			components: { VoxelSelection },
			SingletonEntity,
		},
	} = layers;

	const registerCreation = () => {
		const points: VoxelCoord[] = getComponentValue(VoxelSelection, SingletonEntity)?.points ?? [];
		// only take the last 2 points to register the creation's bounds
		const bounds  = points.slice(-2);
		if(bounds.length < 2) {
			toast("Please select at least 2 points to register a creation.")
			return;
		}
		console.log(bounds)

		api.registerCreation("testcreation", bounds[0], bounds[1]);
	}

	return (
		<ImportContainer onClose={onClose}>
			<p>
				<Gold>Register Creation</Gold>
			</p>
			<Buttons>
				<Button onClick={registerCreation}>Register Creation</Button>
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