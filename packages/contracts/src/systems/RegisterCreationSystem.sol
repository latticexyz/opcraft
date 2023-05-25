// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "solecs/System.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";
import { VoxelsComponent, ID as VoxelsComponentID } from "../components/VoxelsComponent.sol";
import { TypeComponent, ID as TypeComponentID } from "../components/TypeComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { EntityIdComponent, ID as EntityIdComponentID } from "../components/EntityIdComponent.sol";
import { getClaimAtCoord } from "../systems/ClaimSystem.sol";
import { VoxelCoord } from "../types.sol";
import { AirID } from "../prototypes/Blocks.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";

uint256 constant ID = uint256(keccak256("system.RegisterCreation"));

uint256 constant MAX_BLOCKS_IN_CREATION = 100;

contract RegisterCreationSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (string memory creationName, VoxelCoord memory vertex1, VoxelCoord memory vertex2) = abi.decode(
      arguments,
      (string, VoxelCoord, VoxelCoord)
    );
    // Initialize components
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));

    // calculate the corners here (to avoid stack too deep error)
    (VoxelCoord memory lowerSouthWestCorner, VoxelCoord memory upperNorthEastCorner) = getBoundingBox(vertex1, vertex2);
    (uint256 numVoxels, uint256[] memory creationVoxelIds, VoxelCoord[] memory creationVoxelCoords) = getCreationVoxels(
      positionComponent,
      lowerSouthWestCorner,
      upperNorthEastCorner
    );
    // NameComponent nameComponent = NameComponent(getAddressById(components, NameComponentID));
    VoxelsComponent voxelsComponent = VoxelsComponent(getAddressById(components, VoxelsComponentID));
    TypeComponent typeComponent = TypeComponent(getAddressById(components, TypeComponentID));
    // OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));

    require(
      numVoxels <= MAX_BLOCKS_IN_CREATION,
      string(abi.encodePacked("Your creation cannot exceed ", Strings.toString(MAX_BLOCKS_IN_CREATION), " blocks"))
    );

    // check that this creation hasn't been made before
    uint256 creationId = getCreationHash(creationVoxelIds);
    require(
      !voxelsComponent.has(creationId),
      string(
        abi.encodePacked("This creation has already been created. This creation's id is ", Strings.toString(creationId))
      )
    );

    // these components are declared here to avoid "stack too deep"
    // TODO: should names be unique?
    NameComponent(getAddressById(components, NameComponentID)).set(creationId, creationName);
    OwnedByComponent(getAddressById(components, OwnedByComponentID)).set(creationId, addressToEntity(msg.sender));
    EntityIdComponent(getAddressById(components, EntityIdComponentID)).set(creationId, creationId);

    // now we can safely make this new creation
    VoxelCoord[] memory repositionedCoords = repositionBlocksSoLowerSouthwestCornerIsOnOrigin(creationVoxelCoords);

    // TODO: properly clone the voxels. we need to emit a clone event
    for (uint32 i = 0; i < repositionedCoords.length; i++) {
      uint256 newVoxelId = world.getUniqueEntityId();

      VoxelCoord memory repositionedCoord = repositionedCoords[i];
      positionComponent.set(newVoxelId, repositionedCoord);
      // TODO: this should be itemComponent
      // typeComponent.set(newVoxelId, typeComponent.getValue(creationVoxelIds[i]));

      voxelsComponent.addVoxel(creationId, newVoxelId);
    }

    return abi.encode(creationId);
  }

  function getCreationVoxels(
    PositionComponent positionComponent,
    VoxelCoord memory lowerSouthWestCorner,
    VoxelCoord memory upperNorthEastCorner
  )
    private
    view
    returns (
      uint256,
      uint256[] memory,
      VoxelCoord[] memory
    )
  {
    uint32 numVoxelsInVolume = uint32(upperNorthEastCorner.x - lowerSouthWestCorner.x + 1) *
      uint32(upperNorthEastCorner.y - lowerSouthWestCorner.y + 1) *
      uint32(upperNorthEastCorner.z - lowerSouthWestCorner.z + 1);
    uint256[] memory creationVoxelIds = new uint256[](numVoxelsInVolume);
    VoxelCoord[] memory creationVoxelCoords = new VoxelCoord[](numVoxelsInVolume);
    uint256 numVoxels = 0;
    for (int32 x = lowerSouthWestCorner.x; x <= upperNorthEastCorner.x; x++) {
      for (int32 y = lowerSouthWestCorner.y; y <= upperNorthEastCorner.y; y++) {
        for (int32 z = lowerSouthWestCorner.z; z <= upperNorthEastCorner.z; z++) {
          VoxelCoord memory coord = VoxelCoord(x, y, z);
          uint256[] memory entitiesAtPosition = positionComponent.getEntitiesWithValue(coord);
          if (entitiesAtPosition.length == 1) {
            creationVoxelIds[numVoxels] = entitiesAtPosition[0];
            creationVoxelCoords[numVoxels] = coord;
            numVoxels++;
          }
        }
      }
    }
    return (numVoxels, creationVoxelIds, creationVoxelCoords);
  }

  function executeTyped(
    string memory creationName,
    VoxelCoord memory vertex1,
    VoxelCoord memory vertex2
  ) public returns (uint256) {
    return abi.decode(execute(abi.encode(creationName, vertex1, vertex2)), (uint256));
  }

  // TODO: put this into a precompile for speed
  function repositionBlocksSoLowerSouthwestCornerIsOnOrigin(VoxelCoord[] memory creationCoords)
    private
    pure
    returns (VoxelCoord[] memory)
  {
    int32 lowestX = 0;
    int32 lowestY = 0;
    int32 lowestZ = 0;
    for (uint32 i = 0; i < creationCoords.length; i++) {
      VoxelCoord memory voxel = creationCoords[i];
      if (voxel.x < lowestX) {
        lowestX = voxel.x;
      }
      if (voxel.y < lowestY) {
        lowestY = voxel.y;
      }
      if (voxel.z < lowestZ) {
        lowestZ = voxel.z;
      }
    }

    VoxelCoord[] memory repositionedCoords = new VoxelCoord[](creationCoords.length);
    for (uint32 i = 0; i < creationCoords.length; i++) {
      VoxelCoord memory voxel = creationCoords[i];
      VoxelCoord memory newRelativeCoord = VoxelCoord(voxel.x - lowestX, voxel.y - lowestY, voxel.z - lowestZ);
      repositionedCoords[i] = newRelativeCoord;
    }
    return repositionedCoords;
  }

  function getBoundingBox(VoxelCoord memory vertex1, VoxelCoord memory vertex2)
    private
    pure
    returns (VoxelCoord memory, VoxelCoord memory)
  {
    int32 lowerX = vertex1.x < vertex2.x ? vertex1.x : vertex2.x;
    int32 lowerY = vertex1.y < vertex2.y ? vertex1.y : vertex2.y;
    int32 lowerZ = vertex1.z < vertex2.z ? vertex1.z : vertex2.z;

    int32 upperX = vertex1.x > vertex2.x ? vertex1.x : vertex2.x;
    int32 upperY = vertex1.y > vertex2.y ? vertex1.y : vertex2.y;
    int32 upperZ = vertex1.z > vertex2.z ? vertex1.z : vertex2.z;

    return (VoxelCoord(lowerX, lowerY, lowerZ), VoxelCoord(upperX, upperY, upperZ));
  }

  function getCreationHash(uint256[] memory voxelIds) public pure returns (uint256) {
    // TODO: entitiyIds change. should we use voxelType + coord + poweredComponent
    // TODO: have a global way for new systems and components to register a unique voxel name
    return uint256(keccak256(abi.encode(voxelIds)));
  }
}
