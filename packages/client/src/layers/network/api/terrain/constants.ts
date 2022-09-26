export enum Biome {
  Mountains,
  Desert,
  Forest,
  Savanna,
}

export const Biomes: [Biome, Biome, Biome, Biome] = [Biome.Mountains, Biome.Desert, Biome.Forest, Biome.Savanna];

// [humidity, heat]
export const BiomeVectors: { [key in Biome]: [number, number] } = {
  [Biome.Mountains]: [0, 0],
  [Biome.Desert]: [0, 1],
  [Biome.Forest]: [1, 0],
  [Biome.Savanna]: [1, 1],
};

export const STRUCTURE_CHUNK = 5;
export const STRUCTURE_CHUNK_CENTER = Math.floor(STRUCTURE_CHUNK / 2) + 1;
