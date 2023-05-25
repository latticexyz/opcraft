// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.EntityId"));

// maps EntityId -> EntityId (since the frontend only sees entityIdxes in MUD1)
contract EntityIdComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
