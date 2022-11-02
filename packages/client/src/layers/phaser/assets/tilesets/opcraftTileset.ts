import { BlockType } from "../../../network";

// TODO: remove Partial once we've filled it all in
export const Textures: Partial<Record<keyof typeof BlockType, number>> = {
  Air: 0,
  Grass: 40,
  Water: 41,
};
