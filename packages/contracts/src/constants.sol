// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

// Terrain
enum Biome {
  Mountains,
  Desert,
  Forest,
  Savanna
}

uint256 constant GodID = 0x60D;

int32 constant STRUCTURE_CHUNK = 5;
int32 constant STRUCTURE_CHUNK_CENTER = STRUCTURE_CHUNK / 2 + 1;

int32 constant CHUNK = 16;

// A block has six neighbours
uint256 constant NUM_NEIGHBOURS = 6;
uint256 constant MAX_NEIGHBOUR_UPDATE_DEPTH = 100;
