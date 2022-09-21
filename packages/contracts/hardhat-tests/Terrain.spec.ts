/* eslint-disable @typescript-eslint/no-explicit-any */
import { euclidean, random, VoxelCoord } from "@latticexyz/utils";
import { expect } from "chai";
import { BigNumber } from "ethers";
import hardhat from "hardhat";
import { getBiome } from "../../client/src/layers/network/api/terrain/getBiome";
import {
  continentalness,
  desert,
  forest,
  getHeight,
  mountains,
  valleys,
} from "../../client/src/layers/network/api/terrain/getHeight";
import { getTerrain, getTerrainBlock } from "../../client/src/layers/network/api/terrain/getBlockAtPosition";
import { createPerlin } from "@latticexyz/noise";

const ethers = (hardhat as any).ethers;

function toSafeFixedPoint(x: number): { sol: BigNumber; ts: number } {
  const sol = BigNumber.from(Math.floor(x * 2 ** 52)).mul(BigNumber.from(2 ** 12));
  const ts = sol.div(BigNumber.from(2 ** 12)).toNumber() / 2 ** 52;
  return { sol, ts };
}

// Round towards zero
function toPrecision(input: number, precision: number) {
  const sign = input < 0 ? -1 : 1;
  const result = (sign * Math.floor(Math.abs(input * 2 ** precision))) / 2 ** precision;
  return result;
}

function toFloat(x: BigNumber): number {
  return x.div(BigNumber.from(2).pow(54)).toNumber() / 2 ** 10;
}

describe("LibTerrain", () => {
  let LibTerrain: any = null;
  let getBiomeSol: (coord: VoxelCoord) => Promise<number[]> = async () => [];
  let getBiomeTs: (coord: VoxelCoord) => number[] = () => [];

  let getHeightSol: (coord: VoxelCoord) => Promise<number> = async () => 0;
  let getHeightTs: (coord: VoxelCoord) => number = () => 0;

  const splinesSol: { [key: string]: (x: BigNumber) => Promise<number> } = {};
  let euclideanSol: (a: [number, number], b: [number, number]) => Promise<number> = async () => 0;

  let getTerrainBlockSol: (coord: VoxelCoord) => Promise<string> = async () => "0x00";
  let getTerrainBlockTs: (coord: VoxelCoord) => string = () => "0x00";

  before(async () => {
    const Perlin = (await (await ethers.getContractFactory("Perlin")).deploy()).address;
    LibTerrain = await (await ethers.getContractFactory("LibTerrain", { libraries: { Perlin } })).deploy();
    const perlinTs = await createPerlin();

    getBiomeSol = async (coord: VoxelCoord) =>
      (await LibTerrain.getBiome(coord.x, coord.z)).map((b: BigNumber) => toFloat(b));
    getBiomeTs = (coord: VoxelCoord) => getBiome(coord, perlinTs).map((x) => toPrecision(x, 10));

    getHeightSol = async (coord: VoxelCoord) =>
      await LibTerrain.getHeight(coord.x, coord.z, await LibTerrain.getBiome(coord.x, coord.z));
    getHeightTs = (coord: VoxelCoord) => getHeight(coord, getBiome(coord, perlinTs), perlinTs);

    splinesSol["continentalness"] = async (x: BigNumber) => {
      return toFloat(await LibTerrain.continentalness(x));
    };

    splinesSol["mountains"] = async (x: BigNumber) => {
      return toFloat(await LibTerrain.mountains(x));
    };

    splinesSol["desert"] = async (x: BigNumber) => {
      return toFloat(await LibTerrain.desert(x));
    };

    splinesSol["forest"] = async (x: BigNumber) => {
      return toFloat(await LibTerrain.forest(x));
    };

    splinesSol["savanna"] = async (x: BigNumber) => {
      return toFloat(await LibTerrain.savanna(x));
    };

    splinesSol["valleys"] = async (x: BigNumber) => {
      return toFloat(await LibTerrain.valleys(x));
    };

    euclideanSol = async (a: [number, number], b: [number, number]) => {
      const safeA = [toSafeFixedPoint(a[0]).sol, toSafeFixedPoint(a[1]).sol];
      const safeB = [toSafeFixedPoint(b[0]).sol, toSafeFixedPoint(b[1]).sol];
      return toFloat(await LibTerrain.euclideanRaw(safeA[0], safeA[1], safeB[0], safeB[1]));
    };

    getTerrainBlockTs = (coord: VoxelCoord) => {
      const terrain = getTerrain(coord, perlinTs);
      return getTerrainBlock(terrain, coord);
    };

    getTerrainBlockSol = async (coord: VoxelCoord) => {
      const biome = await LibTerrain.getBiome(coord.x, coord.z);
      const height = await LibTerrain.getHeight(coord.x, coord.z, biome);
      return (
        await LibTerrain["getTerrainBlock(int32,int32,int32,int32,int128[4])"](coord.x, coord.y, coord.z, height, biome)
      ).toHexString();
    };
  });

  describe("euclidian", () => {
    it("should compute the euclidian distance between two given vectors", async () => {
      for (let i = 0; i < 30; i++) {
        const a0 = toSafeFixedPoint(Math.random());
        const a1 = toSafeFixedPoint(Math.random());
        const b0 = toSafeFixedPoint(Math.random());
        const b1 = toSafeFixedPoint(Math.random());

        const a: [number, number] = [a0.ts, a1.ts];
        const b: [number, number] = [b0.ts, b1.ts];
        expect(await euclideanSol(a, b)).to.eq(toPrecision(euclidean(a, b), 10));
      }
    });
  });

  describe("getBiome", () => {
    it("should compute the same biome vector as getBiomeTs", async () => {
      // Fixed coords
      const coords = [
        { x: -23, y: 299, z: -230 },
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 10, z: 10 },
        { x: 2334, y: -100, z: 1343 },
        { x: 24, y: 0, z: -3243 },
      ];

      for (const coord of coords) {
        expect(await getBiomeSol(coord)).to.deep.eq(getBiomeTs(coord));
      }

      // Random coords
      for (let i = 0; i < 30; i++) {
        const coord = { x: random(1000, -1000), y: random(1000, -1000), z: random(1000, -1000) };
        expect(await getBiomeSol(coord)).to.deep.eq(getBiomeTs(coord));
      }
    });

    it("sum of the biome vector should be greater than 0 and less than 3", async () => {
      const coords = [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 10, z: 10 },
        { x: -23, y: 299, z: -230 },
        { x: 2334, y: -100, z: 1343 },
        { x: 24, y: 0, z: -3243 },
      ];

      for (const coord of coords) {
        const sum = (await getBiomeSol(coord)).reduce((acc, curr) => acc + curr, 0);
        expect(sum).to.gt(0);
        expect(sum).to.lte(3);
      }
    });
  });

  describe("Splines", () => {
    const precision = 10;

    describe("continentalness", () => {
      it("should compute the same value on the contract as on the client", async () => {
        for (let i = 0; i < 100; i++) {
          const x = Math.random();
          const input = toSafeFixedPoint(x);
          const sol = toPrecision(await splinesSol["continentalness"](input.sol), precision);
          const ts = toPrecision(continentalness(input.ts), precision);
          expect(sol).to.eq(ts);
        }
      });
    });

    describe("mountains", () => {
      it("should compute the same value on the contract as on the client", async () => {
        for (let i = 0; i < 100; i++) {
          const x = Math.random();
          const input = toSafeFixedPoint(x);
          const sol = toPrecision(await splinesSol["mountains"](input.sol), precision);
          const ts = toPrecision(mountains(input.ts), precision);
          expect(sol).to.eq(ts);
        }
      });
    });

    describe("desert", () => {
      it("should compute the same value on the contract as on the client", async () => {
        for (let i = 0; i < 100; i++) {
          const x = Math.random();
          const input = toSafeFixedPoint(x);
          const sol = toPrecision(await splinesSol["desert"](input.sol), precision);
          const ts = toPrecision(desert(input.ts), precision);
          expect(sol).to.eq(ts);
        }
      });
    });

    describe("forest", () => {
      it("should compute the same value on the contract as on the client", async () => {
        for (let i = 0; i < 100; i++) {
          const x = Math.random();
          const input = toSafeFixedPoint(x);
          const sol = toPrecision(await splinesSol["forest"](input.sol), precision);
          const ts = toPrecision(forest(input.ts), precision);
          expect(sol).to.eq(ts);
        }
      });
    });

    describe("valleys", () => {
      it("should compute the same value on the contract as on the client", async () => {
        for (let i = 0; i < 100; i++) {
          const x = Math.random();
          const input = toSafeFixedPoint(x);
          const sol = toPrecision(await splinesSol["valleys"](input.sol), precision);
          const ts = toPrecision(valleys(input.ts), precision);
          expect(sol).to.eq(ts);
        }
      });
    });
  });

  describe("getHeight", () => {
    it("should compute the same height as getHeightTs", async () => {
      // Fixed coords
      const coords = [
        { x: -23, y: 299, z: -230 },
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 10, z: 10 },
        { x: 2334, y: -100, z: 1343 },
        { x: 24, y: 0, z: -3243 },
      ];

      for (const coord of coords) {
        const solHeight = await getHeightSol(coord);
        const tsHeight = getHeightTs(coord);
        expect(solHeight).to.eq(tsHeight);
      }

      // Random coords
      for (let i = 0; i < 30; i++) {
        const coord = { x: random(1000, -1000), y: random(1000, -1000), z: random(1000, -1000) };
        const solHeight = await getHeightSol(coord);
        const tsHeight = getHeightTs(coord);
        expect(solHeight).to.eq(tsHeight);
      }
    });
  });

  describe("getTerrainBlock", () => {
    it("should compute the same result as getTerrainBlockTs", async () => {
      // Fixed coords
      const coords = [
        { x: -23, y: 299, z: -230 },
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 10, z: 10 },
        { x: 2334, y: -100, z: 1343 },
        { x: 24, y: 0, z: -3243 },
      ];

      for (const coord of coords) {
        console.log("coord", coord);
        const solBlock = await getTerrainBlockSol(coord);
        const tsBlock = getTerrainBlockTs(coord);
        expect(solBlock).to.eq(tsBlock);
      }

      // Random coords
      for (let i = 0; i < 30; i++) {
        const coord = { x: random(1000, -1000), y: random(1000, -1000), z: random(1000, -1000) };
        const solBlock = await getTerrainBlockSol(coord);
        const tsBlock = getTerrainBlockTs(coord);
        expect(solBlock).to.eq(tsBlock);
      }
    });
  });
});
