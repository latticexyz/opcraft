/* eslint-disable @typescript-eslint/no-explicit-any */
import { euclidean, mapObject, random, VoxelCoord } from "@latticexyz/utils";
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
import { getTerrainBlock } from "../../client/src/layers/network/api/terrain/getBlockAtPosition";
import { createPerlin } from "@latticexyz/noise";
import { BlockIdToKey, BlockType } from "../../client/src/layers/network/constants";
import { EntityID } from "@latticexyz/recs";
import { Biome } from "../../client/src/layers/network/api/terrain/constants";
import { getTerrain } from "../../client/src/layers/network/api";
import { getCoordHash, getChunkHash, getBiomeHash } from "../../client/src/layers/network/api/terrain/utils";

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

  let getTerrainBlockSol: (coord: VoxelCoord) => Promise<string> = async () => "not setup";
  let getTerrainBlockTs: (coord: VoxelCoord) => string = () => "not setup";

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
      return getTerrainBlock(terrain, coord, perlinTs);
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

  describe("getCoordHash", () => {
    it("should compute the same result as getCoordHash on the client", async () => {
      const coord = { x: 5341, y: 8, z: -2862 };
      const tsHash = getCoordHash(coord.x, coord.z);
      const solHash = await LibTerrain.getCoordHash(coord.x, coord.z);
      expect(tsHash).to.eq(solHash);
    });
  });

  describe("getChunkHash", () => {
    it("should compute the same result as getCoordHash on the client", async () => {
      const coord = { x: 2483, y: 9, z: -1447 };
      const tsHash = getChunkHash(coord);
      const solChunk = await LibTerrain.getChunkCoord(coord.x, coord.z);
      const solHash = await LibTerrain.getCoordHash(solChunk[0], solChunk[1]);
      expect(tsHash).to.eq(solHash);
    });
  });

  describe("getBiomeHash", () => {
    it("should compute the same result as getBiomeHash on the client", async () => {
      const coords = [
        { x: 5341, y: 8, z: -2862 },
        { x: -206, y: 3, z: 448 },
      ];
      for (const coord of coords) {
        const biome = Biome.Desert;
        const tsHash = getBiomeHash(coord, biome);
        const solHash = await LibTerrain.getBiomeHash(coord.x, coord.z, biome);
        expect(tsHash).to.eq(solHash);
      }
    });
  });

  const CHECK_RANDOM_COORDS = false;
  describe("getTerrainBlock", () => {
    it("should compute the same result as getTerrainBlockTs", async () => {
      // Fixed coords
      console.log("Check fixed coords");
      const coords = [
        { x: -1598, y: 10, z: 4650 }, // Sand
        { x: 3275, y: 20, z: 4363 }, // Air
        { x: -5691, y: -2, z: 3607 }, // Dirt
        { x: 7589, y: -22, z: 6838 }, // Stone
        { x: -6903, y: 15, z: -9143 }, // Grass
        { x: 5974, y: -13, z: 8968 }, // Water
        { x: -9977, y: -15, z: -9312 }, // Clay
        { x: 7336, y: 8, z: 9925 }, // GrassPlant
        { x: -7839, y: 57, z: 8037 }, // Snow
        { x: 1402, y: 13, z: 3338 }, // Wool
        { x: 4323, y: 4, z: 278 }, // Log
        { x: -1233, y: -260, z: -3420 }, // Bedrock
        { x: 1820, y: 0, z: 4369 }, // Kelp
        { x: 1454, y: 10, z: 6252 }, // PinkFlower
        { x: 8006, y: 10, z: 1677 }, // Diamond
        { x: 2573, y: 8, z: -8277 }, // PurpleFlower
        { x: 78, y: 44, z: 1715 }, // LightBlueFlower
        { x: 6994, y: 10, z: 3434 }, // MagentaFlower
        { x: -838, y: 15, z: -8044 }, // BlueFlower
        { x: -3451, y: 13, z: 7986 }, // CyanFlower
        { x: -5879, y: 22, z: -5889 }, // LightGrayFlower
        { x: 9417, y: 10, z: 9424 }, // RedFlower
        { x: 9049, y: 59, z: 4909 }, // GrayFlower
        { x: 8012, y: 12, z: -8047 }, // LimeFlower
        { x: 5471, y: 27, z: 7677 }, // GreenFlower
        { x: 5668, y: 9, z: 1835 }, // OrangeFlower
        { x: 5435, y: 5, z: -7440 }, // BlackFlower
        { x: 2483, y: 9, z: -1447 }, // Log
        { x: -1547, y: 8, z: -822 }, // Dirt
        { x: -1547, y: 9, z: -822 }, // Grass
        { x: -1547, y: 10, z: -822 }, // Log
        { x: -1547, y: 11, z: -822 }, // Log
        { x: -1547, y: 12, z: -822 }, // Log
        { x: -1547, y: 13, z: -822 }, // Log
        { x: -1547, y: 14, z: -822 }, // Leaves
        { x: -1547, y: 15, z: -822 }, // Air
        { x: -1548, y: 13, z: -822 }, // Leaves
        { x: -206, y: 3, z: 448 }, // Wool
      ];

      for (const coord of coords) {
        const solResult = await getTerrainBlockSol(coord);
        const tsResult = getTerrainBlockTs(coord);

        const type = BlockIdToKey[tsResult as EntityID];
        console.log(coord, ", //", type);

        try {
          expect(solResult).to.eq(tsResult);
        } catch (e) {
          console.log("Error at", coord);
          throw e;
        }
      }

      if (!CHECK_RANDOM_COORDS) return;
      const NUM_RANDOM_COORDS = 10000;

      const acc: { [key in keyof typeof BlockType]: number } = mapObject(BlockType, () => 0);

      console.log("Check random coords on surface level");
      // Random coords on surface level (for flowers)
      for (let i = 0; i < NUM_RANDOM_COORDS; i++) {
        const x = random(10000, -10000);
        const z = random(10000, -10000);
        const y = getHeightTs({ x, y: 0, z });
        const coord = { x, y, z };
        const solResult = await getTerrainBlockSol(coord);
        const tsResult = getTerrainBlockTs(coord);

        // Log the location of the first block type that was found
        const type = BlockIdToKey[tsResult as EntityID];
        acc[type]++;
        if (acc[type] === 1) {
          console.log(coord, ", //", type);
        }

        try {
          expect(solResult).to.eq(tsResult);
        } catch (e) {
          console.log("Error at", coord);
          throw e;
        }
      }

      console.log("Check random coords one below surface level");
      // Random coords on surface level (for flowers)
      for (let i = 0; i < NUM_RANDOM_COORDS; i++) {
        const x = random(10000, -10000);
        const z = random(10000, -10000);
        const y = getHeightTs({ x, y: 0, z }) - 1;
        const coord = { x, y, z };
        const solResult = await getTerrainBlockSol(coord);
        const tsResult = getTerrainBlockTs(coord);

        // Log the location of the first block type that was found
        const type = BlockIdToKey[tsResult as EntityID];
        acc[type]++;
        if (acc[type] === 1) {
          console.log(coord, ", //", type);
        }

        try {
          expect(solResult).to.eq(tsResult);
        } catch (e) {
          console.log("Error at", coord);
          throw e;
        }
      }

      console.log("Check random coords");
      // Random coords on surface level (for flowers)
      for (let i = 0; i < NUM_RANDOM_COORDS; i++) {
        const x = random(10000, -10000);
        const y = random(100, -260);
        const z = random(10000, -10000);
        const coord = { x, y, z };
        const solResult = await getTerrainBlockSol(coord);
        const tsResult = getTerrainBlockTs(coord);

        // Log the location of the first block type that was found
        const type = BlockIdToKey[tsResult as EntityID];
        acc[type]++;
        if (acc[type] === 1) {
          console.log(coord, ", //", type);
        }

        try {
          expect(solResult).to.eq(tsResult);
        } catch (e) {
          console.log("Error at", coord);
          throw e;
        }
      }
    }).timeout(Number.MAX_SAFE_INTEGER);
  });
});
