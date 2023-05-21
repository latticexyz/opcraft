import React from "react";
import styled from "styled-components";
import { Button, CloseableContainer, Gold } from "./common";
import {Layers} from "../../../types";
import {TransitionRuleStruct} from "contracts/types/ethers-contracts/RegisterVoxelTypeSystem";
import {defineNumberComponent} from "@latticexyz/std-client";
import {defineVoxelRulesComponent} from "../../network/components";
import {EntityIndex} from "@latticexyz/recs";


const createTransitionRule = (hasNeighboringVoxelType:number, changeMyselfToVoxelType:number):TransitionRuleStruct => {
	return {
		lookForType: hasNeighboringVoxelType,
		changeToType: changeMyselfToVoxelType,
		// hasNeighboringVoxelType: "d46ca57200929c441898fb9cae5ab569fe031a88fd000b65889d842c12018e59",
		// changeMyselfToVoxelType: "d46ca57200929c441898fb9cae5ab569fe031a88fd000b65889d842c12018e59",
	}
}

export const RegisterVoxelType: React.FC<{ onClose: () => void; layers: Layers}> = ({ onClose, layers }) => {
	const {
		network: {
			api,
			components: {VoxelRules, Name}
		},
	} = layers;

	// This is called WAYYYY too many times. but I don't really care rn.
	// VoxelRules.update$.subscribe((u) => {
	// 	console.log("voxel type update");
	// 	const voxelRulesMap:Map<EntityIndex, number[]> = VoxelRules.values.value;
	// 	const nameMap:Map<EntityIndex, string> = Name.values.value;
	// 	const voxelTypeIds = voxelRulesMap.keys();
	// 	console.log(u);
	// 	for(const voxelTypeId of voxelTypeIds){
	// 		if(voxelTypeId === undefined){
	// 			continue
	// 		}
	// 		// console.log(nameMap.get(voxelTypeId));
	// 		// api.giftVoxel(voxelTypeId);
	// 	}
	// });

	const registerVoxel = () => {
		console.log("register voxel");
		const transitionRules =[createTransitionRule(2, 1)]
		// const v = BigNumber.from(transitionRules[0].changeMyselfToVoxelType);
		// console.log(transitionRules)
		api.registerVoxelType("test14", transitionRules, "#003300");
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