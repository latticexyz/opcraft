import { Mesh, StandardMaterial, Color3 } from "@babylonjs/core";
import { defineSystem, EntityIndex, getComponentValueStrict, Has, Not, UpdateType } from "@latticexyz/recs";
import { getAddressColor } from "@latticexyz/std-client";
import { VoxelCoord } from "@latticexyz/utils";
import { NetworkLayer } from "../../network";
import { applyModel } from "../engine/model";
import { NoaLayer } from "../types";

export function createPositionSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    noa,
    components: { LocalPosition },
    api: { setBlock },
  } = context;

  const {
    world,
    network: { connectedAddress },
    components: { BlockType, Name },
  } = network;

  const mudToNoaId = new Map<number, number>();

  function spawnPlayer(entity: EntityIndex, isPlayer: boolean) {
    const noaEntity = isPlayer ? noa.playerEntity : noa.entities.add();

    mudToNoaId.set(entity, noaEntity);

    console.log("spawning player", noaEntity);
    // get the player entity's ID and other info (position, size, ..)
    // TODO: set this outside of noa to make dynamic and multiplayer
    const dat = noa.entities.getPositionData(noa.playerEntity);
    const w = dat?.width;
    const h = dat?.height ?? 0;

    const scene = noa.rendering.getScene();
    const mesh = Mesh.CreateBox("player-mesh", 1, scene);
    if (w != null) mesh.scaling.x = w;
    if (w != null) mesh.scaling.z = w;
    if (h != null) mesh.scaling.y = h;

    const address = world.entities[entity];
    const color = getAddressColor(address);
    const hexString = "#" + color.toString(16);
    const material = new StandardMaterial(address, scene);
    material.alpha = 1;
    material.diffuseColor = Color3.FromHexString(hexString);
    mesh.material = material;

    // add "mesh" component to the player entity
    // this causes the mesh to move around in sync with the player entity
    noa.entities.addComponentAgain(noaEntity, noa.entities.names.mesh, {
      mesh: mesh,
      // offset vector is needed because noa positions are always the
      // bottom-center of the entity, and Babylon's CreateBox gives a
      // mesh registered at the center of the box
      offset: [0, h / 2, 0],
    });
    applyModel(
      noa,
      noaEntity,
      noaEntity.toString(),
      "./assets/models/player.json",
      "./assets/skins/steve.png",
      0,
      true,
      "Steve",
      [1, 1, 1]
    );
  }

  // Bad style, don't try at home
  // const moveInProgress = new Map<EntityIndex, boolean>();
  // const queuedMove = new Map<EntityIndex, VoxelCoord>();

  async function movePlayer(entity: EntityIndex, pos: VoxelCoord) {
    // Only one move at a time
    // if (moveInProgress.get(entity)) {
    //   return queuedMove.set(entity, pos);
    // }

    // moveInProgress.set(entity, true);

    const noaEntity = mudToNoaId.get(entity);
    if (noaEntity == null) return console.error("Need to spawn entity first", entity);

    noa.entities.setPosition(noaEntity, pos.x, pos.y, pos.z);

    // TODO: figure out smooth movement
    // const currentPos = noa.entities.getPosition(noaEntity);
    // console.log("got current position", currentPos);
    // const delta = [pos.x - currentPos[0], pos.y - currentPos[1], pos.z - currentPos[2]];
    // if (delta[0] == 0 && delta[1] == 0 && delta[2] == 0) return;

    // // "Smooth movement"
    // const steps = 1000;
    // for (let i = 1; i <= steps; i++) {
    //   console.log("move step ", i, delta, pos, currentPos);
    //   const newPos = currentPos.map((p, j) => p + (i / steps) * delta[j]);
    //   noa.entities.setPosition(noaEntity, newPos[0], newPos[1], newPos[2]);
    //   console.log("setting position to", newPos);
    // }

    // // Release lock
    // moveInProgress.set(entity, false);
    // const nextMove = queuedMove.get(entity);
    // if (nextMove) {
    //   queuedMove.delete(entity);
    //   movePlayer(entity, nextMove);
    // }
  }

  // Everything with a position that is no block is considered a player
  defineSystem(world, [Has(LocalPosition), Not(BlockType)], (update) => {
    if (update.type === UpdateType.Exit) {
      // Remove player
      // TODO: figure out how to remove an entity in NOA
      return;
    }

    const isPlayer = world.entities[update.entity] === connectedAddress.get();

    const position = getComponentValueStrict(LocalPosition, update.entity);
    if (update.type === UpdateType.Enter) {
      // Set player position
      spawnPlayer(update.entity, isPlayer);
    }

    !isPlayer && movePlayer(update.entity, position);
  });
}
