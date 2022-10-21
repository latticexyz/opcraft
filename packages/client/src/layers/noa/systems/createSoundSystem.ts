import { Scene, Sound } from "@babylonjs/core";
import { defineComponentSystem, defineRxSystem, getComponentValue, updateComponent } from "@latticexyz/recs";
import { isNotEmpty, pickRandom } from "@latticexyz/utils";
import { timer } from "rxjs";
import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export function createSoundSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    audioEngine,
    components: { Sounds },
    SingletonEntity,
    world,
    noa,
    api,
  } = context;
  if (!audioEngine) return console.warn("No audio engine found");
  const scene: Scene = noa.rendering.getScene();
  const musicUrls = [
    "/audio/OP_World_Theme_Mix_1.mp3",
    "/audio/Berceuse._Mix_1.mp3",
    "/audio/Gymnopedia_Mix_2.mp3",
    "audio/Mazurka Op.25 No. 2_Mix_1.mp3",
  ];

  // Register custom button
  audioEngine.useCustomUnlockedButton = true;

  // Register music
  const themes = musicUrls.map((url, index) => {
    const sound: Sound = new Sound("theme" + index, url, null, null);
    sound.onended = () => updateComponent(Sounds, SingletonEntity, { playingTheme: undefined });
    return sound.name;
  });
  updateComponent(Sounds, SingletonEntity, { themes });

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
  defineRxSystem(world, timer(0, 10000), () => {
    const currentlyPlaying = getComponentValue(Sounds, SingletonEntity)?.playingTheme;
    if (!currentlyPlaying && Math.random() < 0.5) {
      const playingTheme = (isNotEmpty(themes) && pickRandom(themes)) || undefined;
      updateComponent(Sounds, SingletonEntity, { playingTheme });
    }
  });
}
