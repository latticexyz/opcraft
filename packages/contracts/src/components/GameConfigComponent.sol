// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/Component.sol";

uint256 constant ID = uint256(keccak256("component.GameConfig"));

struct GameConfig {
  bool creativeMode;
}

contract GameConfigComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](1);
    values = new LibTypes.SchemaValue[](1);

    keys[0] = "creativeMode";
    values[0] = LibTypes.SchemaValue.BOOL;
  }

  function set(uint256 entity, GameConfig memory gameConfig) public {
    set(entity, abi.encode(gameConfig));
  }

  function getValue(uint256 entity) public view returns (GameConfig memory) {
    GameConfig memory gameConfig = abi.decode(getRawValue(entity), (GameConfig));
    return gameConfig;
  }

  function getEntitiesWithValue(GameConfig memory value) public view returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(value));
  }
}
