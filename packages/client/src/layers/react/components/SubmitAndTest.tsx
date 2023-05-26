import React from "react";
import styled from "styled-components";
import { Button, CloseableContainer, Gold } from "./common";
import {Layers} from "../../../types";
import {keccak256, VoxelCoord} from "@latticexyz/utils";
import {defineRxSystem, EntityID, getComponentValue} from "@latticexyz/recs";
import {toast} from "react-toastify";
import {distinct} from "rxjs";

export const SubmitAndTest: React.FC<{ onClose: () => void; layers: Layers}> = ({ onClose, layers }) => {
	const {
		network: {
			api,
			components: {EntityId, PassesTests}, // so far only creations set this entityid field rn
		},
		noa: {
			world,
			components: { VoxelSelection },
			SingletonEntity,
		},
	} = layers;

	const [creationIds, setCreationIds] = React.useState<string[]>();
	const [passesTests, setPassesTests] = React.useState<string[]>();
	React.useEffect(() => {
		setCreationIds(Array.from(EntityId.values.value.values()));
		defineRxSystem(world, EntityId.update$.pipe(distinct()), (update) => {
				setCreationIds(Array.from(EntityId.values.value.values()));
		});

		const andTestId =  keccak256("system.AndTest") as EntityID;

		setPassesTests(Array.from(PassesTests.values.value.get(andTestId)));
		defineRxSystem(world, PassesTests.update$.pipe(distinct()), (update) => {
			setPassesTests(Array.from(EntityId.values.value.get(andTestId)));
		});
	}, []);

	const submit = (creationId: string) => {
		let points: VoxelCoord[] = getComponentValue(VoxelSelection, SingletonEntity)?.points ?? [];
		// only take the last 3 points to submit the test
		points = points.slice(-3);
		if(points.length < 3) {
			toast("Please select at least 3 points to submit the and test.")
			return;
		}

		api.submitAndTest(creationId, points);
	}

	return (
		<ImportContainer onClose={onClose}>
			<p>
				<Gold>Submit And Test</Gold>
			</p>
				<IdContainer>
			{
				creationIds?.map((id) => {
					return (
							<Button key={`creation-id-${id}`} onClick={() => submit(id)}>Submit 0x{id.slice(0,7)}...</Button>
					)
				})
			}
				</IdContainer>
			<div>
				<p>Creation that passed</p>


			</div>


		</ImportContainer>
	);
};

const ImportContainer = styled(CloseableContainer)`
  line-height: 1;
  pointer-events: all;
  min-width: 200px;
`;

const IdContainer = styled.div`
  margin-top: 8px;
  display: grid;
  grid-gap: 9px;
  grid-auto-flow: column;
`;
