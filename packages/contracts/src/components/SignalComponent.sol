// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "solecs/Component.sol";

import { BlockDirection } from "../types.sol";

uint256 constant ID = uint256(keccak256("component.Signal"));

struct SignalData {
  bool isActive;
  BlockDirection direction;
}

contract SignalComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](2);
    values = new LibTypes.SchemaValue[](2);

    keys[0] = "isActive";
    values[0] = LibTypes.SchemaValue.BOOL;

    keys[1] = "direction";
    values[1] = LibTypes.SchemaValue.INT32;
  }

  function set(uint256 entity, SignalData calldata value) public virtual {
    set(entity, abi.encode(value));
  }

  function getValue(uint256 entity) public view virtual returns (SignalData memory) {
    (bool isActive, BlockDirection direction) = abi.decode(getRawValue(entity), (bool, BlockDirection));
    return SignalData(isActive, direction);
  }

  function getEntitiesWithValue(SignalData calldata signalData) public view virtual returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(signalData));
  }
}
