import { VoxelCoord } from "@latticexyz/utils";
import { BlockType } from "../../constants";
import { Structure } from "../../types";

export const STRUCTURE_CHUNK = 5;

function getEmptyStructure(): Structure {
  return [
    [[], [], [], [], []],
    [[], [], [], [], []],
    [[], [], [], [], []],
    [[], [], [], [], []],
    [[], [], [], [], []],
  ];
}

function getTree(): Structure {
  const s = getEmptyStructure();

  // Trunk
  s[3][0][3] = BlockType.Log;
  s[3][1][3] = BlockType.Log;
  s[3][2][3] = BlockType.Log;
  s[3][3][3] = BlockType.Log;

  // Leaves
  s[2][3][3] = BlockType.Leaves;
  s[3][3][2] = BlockType.Leaves;
  s[4][3][3] = BlockType.Leaves;
  s[3][3][4] = BlockType.Leaves;
  s[2][3][2] = BlockType.Leaves;
  s[4][3][4] = BlockType.Leaves;
  s[2][3][4] = BlockType.Leaves;
  s[4][3][2] = BlockType.Leaves;
  s[2][4][3] = BlockType.Leaves;
  s[3][4][2] = BlockType.Leaves;
  s[4][4][3] = BlockType.Leaves;
  s[3][4][4] = BlockType.Leaves;
  s[3][4][3] = BlockType.Leaves;

  return s;
}

function getWoolTree(): Structure {
  const s = getEmptyStructure();

  // Trunk
  s[3][0][3] = BlockType.Log;
  s[3][1][3] = BlockType.Log;
  s[3][2][3] = BlockType.Log;
  s[3][3][3] = BlockType.Log;

  // Leaves
  s[2][2][3] = BlockType.Wool;
  s[3][2][2] = BlockType.Wool;
  s[4][2][3] = BlockType.Wool;
  s[3][2][4] = BlockType.Wool;
  s[2][3][3] = BlockType.Wool;
  s[3][3][2] = BlockType.Wool;
  s[4][3][3] = BlockType.Wool;
  s[3][3][4] = BlockType.Wool;
  s[2][3][2] = BlockType.Wool;
  s[4][3][4] = BlockType.Wool;
  s[2][3][4] = BlockType.Wool;
  s[4][3][2] = BlockType.Wool;
  s[2][4][3] = BlockType.Wool;
  s[3][4][2] = BlockType.Wool;
  s[4][4][3] = BlockType.Wool;
  s[3][4][4] = BlockType.Wool;
  s[3][4][3] = BlockType.Wool;

  return s;
}

export const tree = getTree();
export const woolTree = getWoolTree();

// Structure models
export function getStructureBlock(structure: Structure, { x, y, z }: VoxelCoord) {
  if (x < 0 || y < 0 || z < 0 || x >= STRUCTURE_CHUNK || y >= STRUCTURE_CHUNK || z >= STRUCTURE_CHUNK) return undefined;
  return structure[x][y][z];
}
