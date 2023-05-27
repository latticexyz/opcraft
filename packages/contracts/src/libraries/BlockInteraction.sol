// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import "solecs/System.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { ItemComponent, ID as ItemComponentID } from "../components/ItemComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { ClaimComponent, ID as ClaimComponentID, Claim } from "../components/ClaimComponent.sol";
import { TypeComponent, ID as TypeComponentID } from "../components/TypeComponent.sol";
import { SignalSystem, ID as SignalSystemID } from "../systems/SignalSystem.sol";
import { SignalSourceSystem, ID as SignalSourceSystemID } from "../systems/SignalSourceSystem.sol";
import { InvertedSignalSystem, ID as InvertedSignalSystemID } from "../systems/InvertedSignalSystem.sol";
import { PoweredSystem, ID as PoweredSystemID } from "../systems/PoweredSystem.sol";
import { PistonSystem, ID as PistonSystemID } from "../systems/PistonSystem.sol";
import { getClaimAtCoord } from "../systems/ClaimSystem.sol";
import { VoxelCoord } from "../types.sol";
import { AirID } from "../prototypes/Blocks.sol";
import { NUM_NEIGHBOURS, MAX_NEIGHBOUR_UPDATE_DEPTH } from "../constants.sol";
import { hasEntity } from "../utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";

library BlockInteraction {
  function calculateNeighbourEntities(IUint256Component components, uint256 centerEntity)
    public
    returns (uint256[] memory)
  {
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));

    uint256[] memory centerNeighbourEntities = new uint256[](NUM_NEIGHBOURS);
    VoxelCoord memory baseCoord = positionComponent.getValue(centerEntity);

    for (uint8 i = 0; i < centerNeighbourEntities.length; i++) {
      uint256[] memory neighbourEntitiesAtPosition;
      if (i == 0) {
        neighbourEntitiesAtPosition = positionComponent.getEntitiesWithValue(
          VoxelCoord({ x: baseCoord.x + 1, y: baseCoord.y, z: baseCoord.z })
        );
      } else if (i == 1) {
        neighbourEntitiesAtPosition = positionComponent.getEntitiesWithValue(
          VoxelCoord({ x: baseCoord.x - 1, y: baseCoord.y, z: baseCoord.z })
        );
      } else if (i == 2) {
        neighbourEntitiesAtPosition = positionComponent.getEntitiesWithValue(
          VoxelCoord({ x: baseCoord.x, y: baseCoord.y + 1, z: baseCoord.z })
        );
      } else if (i == 3) {
        neighbourEntitiesAtPosition = positionComponent.getEntitiesWithValue(
          VoxelCoord({ x: baseCoord.x, y: baseCoord.y - 1, z: baseCoord.z })
        );
      } else if (i == 4) {
        neighbourEntitiesAtPosition = positionComponent.getEntitiesWithValue(
          VoxelCoord({ x: baseCoord.x, y: baseCoord.y, z: baseCoord.z + 1 })
        );
      } else if (i == 5) {
        neighbourEntitiesAtPosition = positionComponent.getEntitiesWithValue(
          VoxelCoord({ x: baseCoord.x, y: baseCoord.y, z: baseCoord.z - 1 })
        );
      }

      require(
        neighbourEntitiesAtPosition.length == 0 || neighbourEntitiesAtPosition.length == 1,
        "can not built at non-empty coord (3)"
      );
      if (neighbourEntitiesAtPosition.length == 1) {
        // entity exists so add it to the list
        centerNeighbourEntities[i] = neighbourEntitiesAtPosition[0];
      } else {
        // no entity exists so add air
        centerNeighbourEntities[i] = 0;
      }
    }

    return centerNeighbourEntities;
  }

  function runInteractionSystems(
    IUint256Component systems,
    IUint256Component components,
    uint256 centerEntity
  ) public {
    // TODO: instead of hard coding which systems to call, load them from a list so anybody can add to this list
    SignalSystem signalSystem = SignalSystem(getAddressById(systems, SignalSystemID));
    SignalSourceSystem signalSourceSystem = SignalSourceSystem(getAddressById(systems, SignalSourceSystemID));
    InvertedSignalSystem invertedSignalSystem = InvertedSignalSystem(getAddressById(systems, InvertedSignalSystemID));
    PoweredSystem poweredSystem = PoweredSystem(getAddressById(systems, PoweredSystemID));
    PistonSystem pistonSystem = PistonSystem(getAddressById(systems, PistonSystemID));

    // get neighbour entities
    uint256[] memory centerEntitiesToCheckStack = new uint256[](MAX_NEIGHBOUR_UPDATE_DEPTH);
    uint256 centerEntitiesToCheckStackIdx = 0;
    uint256 useStackIdx = 0;

    // start with the center entity
    centerEntitiesToCheckStack[centerEntitiesToCheckStackIdx] = centerEntity;
    useStackIdx = centerEntitiesToCheckStackIdx;
    centerEntitiesToCheckStackIdx++;

    // Leep looping until there is a neighbour to process or we reached max depth
    while (useStackIdx < MAX_NEIGHBOUR_UPDATE_DEPTH) {
      // NOTE:
      // we'll go through each one until there is no more changed entities
      // order in which these systems are called should not matter since they all change their own components

      uint256 useCenterEntityId = centerEntitiesToCheckStack[useStackIdx];
      uint256[] memory useNeighbourEntities = calculateNeighbourEntities(components, useCenterEntityId);
      if (hasEntity(useNeighbourEntities)) {
        // call SignalSystem with centerEntity and neighbourEntities
        uint256[] memory changedSignalSystemEntityIds = signalSystem.executeTyped(
          useCenterEntityId,
          useNeighbourEntities
        );

        // if there are changed entities, we want to keep looping for this system
        for (uint256 i = 0; i < changedSignalSystemEntityIds.length; i++) {
          if (changedSignalSystemEntityIds[i] != 0) {
            centerEntitiesToCheckStack[centerEntitiesToCheckStackIdx] = changedSignalSystemEntityIds[i];
            centerEntitiesToCheckStackIdx++;
            if (centerEntitiesToCheckStackIdx >= MAX_NEIGHBOUR_UPDATE_DEPTH) {
              // TODO: Should tell the user that we reached max depth
              break;
            }
          }
        }

        // call SignalSourceSystem with centerEntity and neighbourEntities
        uint256[] memory changedSignalSourceSystemEntityIds = signalSourceSystem.executeTyped(
          useCenterEntityId,
          useNeighbourEntities
        );

        // if there are changed entities, we want to keep looping for this system
        for (uint256 i = 0; i < changedSignalSourceSystemEntityIds.length; i++) {
          if (changedSignalSourceSystemEntityIds[i] != 0) {
            centerEntitiesToCheckStack[centerEntitiesToCheckStackIdx] = changedSignalSourceSystemEntityIds[i];
            centerEntitiesToCheckStackIdx++;
            if (centerEntitiesToCheckStackIdx >= MAX_NEIGHBOUR_UPDATE_DEPTH) {
              // TODO: Should tell the user that we reached max depth
              break;
            }
          }
        }

        // call SignalSourceSystem with centerEntity and neighbourEntities
        uint256[] memory changedInvertedSignalSystemEntityIds = invertedSignalSystem.executeTyped(
          useCenterEntityId,
          useNeighbourEntities
        );

        // if there are changed entities, we want to keep looping for this system
        for (uint256 i = 0; i < changedInvertedSignalSystemEntityIds.length; i++) {
          if (changedInvertedSignalSystemEntityIds[i] != 0) {
            centerEntitiesToCheckStack[centerEntitiesToCheckStackIdx] = changedInvertedSignalSystemEntityIds[i];
            centerEntitiesToCheckStackIdx++;
            if (centerEntitiesToCheckStackIdx >= MAX_NEIGHBOUR_UPDATE_DEPTH) {
              // TODO: Should tell the user that we reached max depth
              break;
            }
          }
        }

        // call SignalSourceSystem with centerEntity and neighbourEntities
        uint256[] memory changedPoweredSystemEntityIds = poweredSystem.executeTyped(
          useCenterEntityId,
          useNeighbourEntities
        );

        // if there are changed entities, we want to keep looping for this system
        for (uint256 i = 0; i < changedPoweredSystemEntityIds.length; i++) {
          if (changedPoweredSystemEntityIds[i] != 0) {
            centerEntitiesToCheckStack[centerEntitiesToCheckStackIdx] = changedPoweredSystemEntityIds[i];
            centerEntitiesToCheckStackIdx++;
            if (centerEntitiesToCheckStackIdx >= MAX_NEIGHBOUR_UPDATE_DEPTH) {
              // TODO: Should tell the user that we reached max depth
              break;
            }
          }
        }

        uint256[] memory changedPistonSystemEntityIds = pistonSystem.executeTyped(
          useCenterEntityId,
          useNeighbourEntities
        );

        // if there are changed entities, we want to keep looping for this system
        for (uint256 i = 0; i < changedPistonSystemEntityIds.length; i++) {
          if (changedPistonSystemEntityIds[i] != 0) {
            centerEntitiesToCheckStack[centerEntitiesToCheckStackIdx] = changedPistonSystemEntityIds[i];
            centerEntitiesToCheckStackIdx++;
            if (centerEntitiesToCheckStackIdx >= MAX_NEIGHBOUR_UPDATE_DEPTH) {
              // TODO: Should tell the user that we reached max depth
              break;
            }
          }
        }
      }

      // at this point, we've consumed the top of the stack, so we can pop it, in this case, we just increment the stack index
      // check if we added any more
      if ((centerEntitiesToCheckStackIdx - 1) > useStackIdx) {
        useStackIdx++;
      } else {
        // this means we didnt any any updates, so we can break out of the loop
        break;
      }
    }
  }
}
