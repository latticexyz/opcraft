import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineSoundComponent(world: World) {
  return defineComponent(world, {
    themes: Type.OptionalStringArray,
    playingTheme: Type.OptionalString,
    volume: Type.OptionalNumber,
  });
}
