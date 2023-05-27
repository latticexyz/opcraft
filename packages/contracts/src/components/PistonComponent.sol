// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/Component.sol";

import { BlockDirection } from "../types.sol";

uint256 constant ID = uint256(keccak256("component.Piston"));

// TODO: Make this configurable
BlockDirection constant HEAD_EXTEND_DIRECTION = BlockDirection.East;

struct PistonData {
  bool isExtended;
  int32 maxNumBlocksMove;
}

contract PistonComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](2);
    values = new LibTypes.SchemaValue[](2);

    keys[0] = "isExtended";
    values[0] = LibTypes.SchemaValue.BOOL;

    keys[1] = "maxNumBlocksMove";
    values[1] = LibTypes.SchemaValue.INT32;
  }

  function set(uint256 entity, PistonData calldata value) public virtual {
    set(entity, abi.encode(value));
  }

  function getValue(uint256 entity) public view virtual returns (PistonData memory) {
    (bool isExtended, int32 maxNumBlocksMove) = abi.decode(getRawValue(entity), (bool, int32));
    return PistonData(isExtended, maxNumBlocksMove);
  }

  function getEntitiesWithValue(PistonData calldata pistonData) public view virtual returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(pistonData));
  }
}
