/* eslint-disable @typescript-eslint/no-explicit-any */
import { VoxelCoord } from "@latticexyz/utils";
import { expect } from "chai";
import { BigNumber } from "ethers";
import hardhat from "hardhat";
import { getBiome } from "../../client/src/layers/network/api/terrain/getBiome.js";

const ethers = (hardhat as any).ethers;

describe("LibTerrain", () => {
  let LibTerrain: any = null;
  let getBiomeSol: (coord: VoxelCoord) => Promise<number[]> = async () => [];
  let getBiomeTs: (coord: VoxelCoord) => number[] = () => [];

  before(async () => {
    const Perlin = (await (await ethers.getContractFactory("Perlin")).deploy()).address;
    LibTerrain = await (await ethers.getContractFactory("LibTerrain", { libraries: { Perlin } })).deploy();

    getBiomeSol = async (coord: VoxelCoord) =>
      (await LibTerrain.getBiome(coord.x, coord.z)).map(
        (b: BigNumber) => b.div(BigNumber.from(2).pow(54)).toNumber() / 2 ** 10
      );

    getBiomeTs = (coord: VoxelCoord) => getBiome(coord).map((x) => Math.floor(x * 2 ** 10) / 2 ** 10);
  });

  describe("getBiome", () => {
    it("should compute the same biome vector as get getBiomeTs", async () => {
      const coords = [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 10, z: 10 },
        { x: -23, y: 299, z: -230 },
        { x: 2334, y: -100, z: 1343 },
        { x: 24, y: 0, z: -3243 },
      ];

      for (const coord of coords) {
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
        console.log(sum);
        expect(sum).to.gt(0);
        expect(sum).to.lte(3);
      }
    });
  });
});
