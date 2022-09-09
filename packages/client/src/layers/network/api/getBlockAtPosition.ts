import { Component, getComponentValueStrict, Has, HasValue, runQuery, Type } from "@latticexyz/recs";
import { CoordMap, VoxelCoord } from "@latticexyz/utils";
import { BlockType as BlockTypeEnum } from "../constants";
import { perlin } from "@latticexyz/noise";
import IntervalTree from "@flatten-js/interval-tree";

const perlinMap = new CoordMap<number>();

function linearInterpolation(points: [number, number][]) {
  const functions: { a: number; b: number; range: [number, number] }[] = [];
  for (let i = 1; i < points.length; i++) {
    const xn = points[i][0];
    const xm = points[i - 1][0];
    const yn = points[i][1];
    const ym = points[i - 1][1];

    // add coefficients
    functions.push({
      a: ym / (xm - xn) - yn / (xm - xn),
      b: (xm * yn) / (xm - xn) - (xn * ym) / (xm - xn),
      range: [xm, xn],
    });
  }
  return functions;
}

function createSplines(points: [number, number][]) {
  const splines = new IntervalTree<[number, number]>();

  const functions = linearInterpolation(points);

  for (const { a, b, range } of functions) {
    splines.insert(range, [a, b]);
  }

  return function applySpline(x: number): number {
    const spline = splines.search([x, x]);
    if (spline.length === 0) {
      console.warn("no spline found for ", x);
      return x > 100 ? 30 : 0;
    }

    const [a, b] = spline[0];

    return a * x + b;
  };
}

const continentalSplines = createSplines([
  [0, 0],
  [0.3, 0.2],
  [0.5, 0.7],
  [1, 1],
]);

const erosionSplines = createSplines([
  [0, 1],
  [0.2, 0.8],
  [0.4, 0.6],
  [0.6, 0.5],
  [0.8, 0.2],
  [1, 0],
]);

const peaksAndValleySplines = createSplines([
  [0, 0],
  [1, 1],
]);

function noise({ x, y }: { x: number; y: number }) {
  let perlinValue = 0;

  // Continentalness
  perlinValue += continentalSplines(perlin(x, y, perlinValue, 1000)) * 10;

  // Erosion
  perlinValue += erosionSplines(perlin(x, y, perlinValue, 200)) * 5;

  // Peaks & Valeys
  perlinValue += peaksAndValleySplines(perlin(x, y, perlinValue, 49)) * 1;

  perlinValue /= 16;

  // Interesting island landscape:
  // perlinValue += perlin(x, y, perlinValue, 47 * perlin(y, x, 0, 300) * 100) * 4;
  // perlinValue += perlin(x, y, perlinValue, 99) * 3;
  // perlinValue += perlin(x, y, perlinValue, 49) * 2;
  // perlinValue += perlin(x, y, perlinValue, 13);
  // perlinValue /= 4 + 3 + 2 + 1;

  return perlinValue * 256 - 100;
  // return applySpline(perlinValue * 100) - 70;

  // const perlin =
  // (perlinSingle(Math.floor(coord.x * FREQ), Math.floor(coord.y * FREQ), SEED, 32, true) / 64) * AMP + OFFSET;
  // return applySpline(perlin);
  // return Math.floor(cubicNoiseSample2(cubicNoiseConfig(1000, 64, 16, 256, 256), coord.x, coord.y) - 8);
}

function getHeightAt(coord: VoxelCoord) {
  const flatCoord = { x: coord.x, y: coord.z };
  if (!perlinMap.has(flatCoord)) {
    const height = noise(flatCoord);
    perlinMap.set(flatCoord, height);
    return height;
  } else {
    return perlinMap.get(flatCoord) || 0;
  }
}

export function getBlockAtPosition(
  context: {
    Position: Component<{ x: Type.Number; y: Type.Number; z: Type.Number }>;
    BlockType: Component<{ value: Type.Number }>;
  },
  coord: VoxelCoord
) {
  // // First check for user placed block
  // const { Position, BlockType } = context;
  // const blocksAtPosition = [...runQuery([HasValue(Position, coord), Has(BlockType)])];

  // // Prefer non-air blocks at this position
  // const block =
  //   blocksAtPosition?.find((b) => getComponentValueStrict(BlockType, b).value !== BlockTypeEnum.Air) ??
  //   blocksAtPosition[0];
  // if (block != null) return getComponentValueStrict(BlockType, block).value;

  // If no user placed block is found return the nature block of this position
  const height = getHeightAt(coord);

  if (coord.y < height) {
    if (coord.y < 5) return BlockTypeEnum.Sand;
    return BlockTypeEnum.Grass;
  }

  if (coord.y < -10) {
    return BlockTypeEnum.Water;
  }

  return BlockTypeEnum.Air;
}
