// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { StakeComponent, ID as StakeComponentID } from "../components/StakeComponent.sol";
import { ClaimComponent, ID as ClaimComponentID, Claim } from "../components/ClaimComponent.sol";
import { getStakeInChunk, getStakeEntity } from "../systems/StakeSystem.sol";
import { Coord } from "../types.sol";
import { DiamondID } from "../prototypes/Blocks.sol";

uint256 constant ID = uint256(keccak256("system.Claim"));

function getChunkEntity(Coord memory chunk) returns (uint256) {
  return uint256(keccak256(abi.encode(chunk)));
}

function getClaimInChunk(ClaimComponent claimComponent, Coord memory chunk) returns (Claim memory) {
  bytes memory currentClaimBytes = claimComponent.getRawValue(getChunkEntity(chunk));
  return currentClaimBytes.length == 0 ? Claim(0, 0) : abi.decode(currentClaimBytes, (Claim));
}

contract ClaimSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    Coord memory chunk = abi.decode(arguments, (Coord));

    // Initialize components
    StakeComponent stakeComponent = StakeComponent(getAddressById(components, StakeComponentID));
    ClaimComponent claimComponent = ClaimComponent(getAddressById(components, ClaimComponentID));

    uint256 senderStakeInChunk = getStakeInChunk(stakeComponent, getStakeEntity(chunk, msg.sender));
    Claim memory currentClaimInChunk = getClaimInChunk(claimComponent, chunk);

    // Require sender's stake to be higher than the current claim
    require(senderStakeInChunk > currentClaimInChunk.stake, "not enough stake");

    // Claim this chunk
    uint256 chunkEntity = getChunkEntity(chunk);

    claimComponent.set(chunkEntity, Claim(senderStakeInChunk, addressToEntity(msg.sender)));
  }

  function executeTyped(Coord memory chunk) public returns (bytes memory) {
    return execute(abi.encode(chunk));
  }
}
