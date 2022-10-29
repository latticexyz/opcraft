import { Scene, Sound, Vector3 } from "@babylonjs/core";
import { SyncState } from "@latticexyz/network";
import {
  defineComponentSystem,
  defineRxSystem,
  defineSystem,
  EntityID,
  getComponentValue,
  Has,
  isComponentUpdate,
  updateComponent,
  UpdateType,
} from "@latticexyz/recs";
import { euclidean, isNotEmpty, pickRandom } from "@latticexyz/utils";
import { timer } from "rxjs";
import { BlockType, NetworkLayer } from "../../network";
import { BlockIdToKey } from "../../network/constants";
import { NoaLayer } from "../types";

export function createSoundSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    components: { Item, Position, LoadingState },
    api: { getTerrainBlockAtPosition },
  } = network;
  const {
    audioEngine,
    components: { Sounds },
    SingletonEntity,
    world,
    noa,
    streams: { playerPosition$ },
  } = context;
  if (!audioEngine) return console.warn("No audio engine found");
  const scene: Scene = noa.rendering.getScene();
  const musicUrls = [
    "/audio/OP_World_Theme_Mix_1.mp3",
    "/audio/Berceuse_Mix_2.mp3",
    "/audio/Gymnopedia_Mix_3.mp3",
    "/audio/OP_World_2.mp3",
  ];

  // Set the position of the audio listener
  scene.audioListenerPositionProvider = () => {
    const pos = playerPosition$.getValue();
    return new Vector3(pos.x, pos.y, pos.z);
  };

  // Register custom button
  audioEngine.useCustomUnlockedButton = true;

  // Register music
  const themes = musicUrls.map((url, index) => {
    const sound: Sound = new Sound("theme" + index, url, null, null, { volume: 0.5 });
    sound.onended = () => updateComponent(Sounds, SingletonEntity, { playingTheme: undefined });
    return sound.name;
  });
  updateComponent(Sounds, SingletonEntity, { themes });

  function registerSoundEffect(name: string) {
    return new Sound(name, `/audio/effects/${name}.mp3`, null, null, {
      spatialSound: true,
      distanceModel: "exponential",
      volume: 1,
    });
  }

  // Register sound effects
  const effect = {
    break: {
      Dirt: registerSoundEffect("break/dirt"),
      Glass: registerSoundEffect("break/glass"),
      Leaves: registerSoundEffect("break/leaves"),
      Metal: registerSoundEffect("break/metal"),
      Stone: registerSoundEffect("break/stone"),
      Wood: registerSoundEffect("break/wood"),
      Wool: registerSoundEffect("break/wool"),
    },
    place: {
      Dirt: registerSoundEffect("place/dirt"),
      Metal: registerSoundEffect("place/metal"),
      Sand: registerSoundEffect("place/sand"),
      Stone: registerSoundEffect("place/stone"),
      Wood: registerSoundEffect("place/wood"),
    },
  };

  // Start a new theme if the `playingTheme` value changes
  defineComponentSystem(world, Sounds, (update) => {
    const prevPlayingTheme = update.value[1]?.playingTheme;
    const playingTheme = update.value[0]?.playingTheme;

    const prevSound = prevPlayingTheme ? scene.getSoundByName(prevPlayingTheme) : undefined;
    const newSound = playingTheme ? scene.getSoundByName(playingTheme) : undefined;

    prevSound?.stop();
    newSound?.play();
  });

  // Set a new `playingTheme` in random intervals if none is playing
  defineRxSystem(world, timer(0, 60000), () => {
    const currentlyPlaying = getComponentValue(Sounds, SingletonEntity)?.playingTheme;
    if (!currentlyPlaying && Math.random() < 0.5) {
      const playingTheme = (isNotEmpty(themes) && pickRandom(themes)) || undefined;
      updateComponent(Sounds, SingletonEntity, { playingTheme });
    }
  });

  defineSystem(
    world,
    [Has(Position), Has(Item)],
    (update) => {
      // Don't play sounds during initial loading
      if (getComponentValue(LoadingState, SingletonEntity)?.state !== SyncState.LIVE) return;

      // Get data
      const { x, y, z } = playerPosition$.getValue();
      const playerPosArr = [x, y, z];
      const itemType =
        update.type === UpdateType.Exit && isComponentUpdate(update, Item)
          ? update.value[1]?.value
          : getComponentValue(Item, update.entity)?.value;

      const position =
        update.type === UpdateType.Exit && isComponentUpdate(update, Position)
          ? update.value[1]
          : getComponentValue(Position, update.entity);

      if (!itemType || !position) return;

      // Only care about close events
      const blockPosArr = [position.x, position.y, position.z];
      const distance = euclidean(playerPosArr, blockPosArr);
      if (distance > 32) return;

      const blockPosVec = new Vector3(...blockPosArr);

      // Find sound to play
      let itemKey = BlockIdToKey[itemType as EntityID];
      let updateType = update.type;

      // When mining a terrain block, we get an ECS update for an entering air block instead
      // Hack: entity id is the same as entity index for optimistic updates
      if (update.type == UpdateType.Enter && itemType === BlockType.Air) {
        const isOptimisticUpdate = world.entities[update.entity] == (update.entity as unknown);
        if (!isOptimisticUpdate) return;
        itemKey = BlockIdToKey[getTerrainBlockAtPosition(position)];
        updateType = UpdateType.Exit;
      }

      const sound: Sound | undefined = (() => {
        if (updateType === UpdateType.Exit) {
          if (itemKey.includes("Wool")) return effect["break"].Wool;
          if (["Log", "Planks"].includes(itemKey)) return effect["break"].Wood;
          if (["Diamond", "Coal"].includes(itemKey)) return effect["break"].Metal;
          if (["Stone", "Cobblestone", "MossyCobblestone"].includes(itemKey)) return effect["break"].Stone;
          return effect["break"][itemKey as keyof typeof effect["break"]] || effect["break"].Dirt;
        }

        if (updateType === UpdateType.Enter) {
          if (["Log", "Planks"].includes(itemKey)) return effect["place"].Wood;
          if (["Diamond", "Coal"].includes(itemKey)) return effect["place"].Metal;
          if (["Stone", "Cobblestone", "MossyCobblestone"].includes(itemKey)) return effect["place"].Stone;
          return effect["place"][itemKey as keyof typeof effect["place"]] || effect["place"].Dirt;
        }
      })();

      // Play sound
      sound?.setPosition(blockPosVec);
      sound?.play();
    },
    { runOnInit: false }
  );
}
