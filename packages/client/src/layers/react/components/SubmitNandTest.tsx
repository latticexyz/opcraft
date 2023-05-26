import React from "react";
import styled from "styled-components";
import { Button, CloseableContainer, Gold } from "./common";
import {Layers} from "../../../types";
import {keccak256, VoxelCoord} from "@latticexyz/utils";
import {defineRxSystem, EntityID, getComponentValue} from "@latticexyz/recs";
import {toast} from "react-toastify";
import {distinct} from "rxjs";

export const SubmitNandTest: React.FC<{ onClose: () => void; layers: Layers}> = ({ onClose, layers }) => {
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

		const nandTestId =  world.entityToIndex.get(keccak256("system.NandTest") as EntityID);

		setTimeout(() => {
			if(PassesTests.values.value.has(nandTestId)) {
					setPassesTests(Array.from(PassesTests.values.value.get(nandTestId)));
			}
		}, 4000);
		defineRxSystem(world, PassesTests.update$.pipe(distinct()), (update) => {
			setTimeout(() => {
				if(PassesTests.values.value.has(nandTestId)) {
						setPassesTests(Array.from(PassesTests.values.value.get(nandTestId)));
				}
			}, 4000);
		});
	}, []);

	const submit = (creationId: string) => {
		let points: VoxelCoord[] = getComponentValue(VoxelSelection, SingletonEntity)?.points ?? [];
		// only take the last 3 points to submit the test
		points = points.slice(-3);
		if(points.length < 3) {
			toast("Please select at least 3 points to submit the nand test.")
			return;
		}

		api.submitNandTest(creationId, points);
	}

	return (
		<ImportContainer onClose={onClose}>
			<p>
				<Gold>Submit Nand Test</Gold>
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
			{
				passesTests && passesTests.length > 0 && (
				<div>
					<p>Creation that passed</p>
					{
						passesTests?.map((id) => {
							return (
								<div key={`creation-id-${id}`}>0x{id.slice(0,7)}...</div>
							)
						})
					}
				</div>
				)
			}


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
