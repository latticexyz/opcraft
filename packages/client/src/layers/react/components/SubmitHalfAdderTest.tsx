import React from "react";
import styled from "styled-components";
import { Button, CloseableContainer, Gold } from "./common";
import {Layers} from "../../../types";
import {VoxelCoord} from "@latticexyz/utils";
import {defineRxSystem, getComponentValue} from "@latticexyz/recs";
import {toast} from "react-toastify";
import {distinct} from "rxjs";

export const SubmitHalfAdderTest: React.FC<{ onClose: () => void; layers: Layers}> = ({ onClose, layers }) => {
	const {
		network: {
			api,
			components: {EntityId}, // so far only creations set this entityid field rn
		},
		noa: {
			world,
			components: { VoxelSelection },
			SingletonEntity,
		},
	} = layers;

	const [creationIds, setCreationIds] = React.useState<string[]>();
	React.useEffect(() => {
		setCreationIds(Array.from(EntityId.values.value.values()));
		defineRxSystem(world, EntityId.update$.pipe(distinct()), (update) => {
				setCreationIds(Array.from(EntityId.values.value.values()));
		});
	}, []);

	const submit = (creationId: string) => {
		let points: VoxelCoord[] = getComponentValue(VoxelSelection, SingletonEntity)?.points ?? [];
		// only take the last 4 points to submit the test
		points = points.slice(-4);
		if(points.length < 4) {
			toast("Please select at least 4 points to submit the adder test.")
			return;
		}

		api.submitHalfAdderTest(creationId, points);
	}

	return (
		<ImportContainer onClose={onClose}>
			<p>
				<Gold>Submit Half Adder Test</Gold>
			</p>
				<Buttons>
			{
				creationIds?.map((id) => {
					return (
							<Button key={`creation-id-${id}`} onClick={() => submit(id)}>Submit 0x{id.slice(0,7)}...</Button>
					)
				})
			}
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