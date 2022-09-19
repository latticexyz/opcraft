// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { Perlin } from "noise/Perlin.sol";
import { ABDKMath64x64 as Math } from "abdk-libraries-solidity/ABDKMath64x64.sol";
import { Biome } from "../constants.sol";
import { VoxelCoord } from "std-contracts/components/VoxelCoordComponent.sol";
import { AirID, GrassID, DirtID, LogID, SandID, StoneID, WaterID, CobblestoneID, CoalID, CraftingID, IronID, GoldID, DiamondID, LeavesID, PlanksID } from "../prototypes/Blocks.sol";

int128 constant _0 = 0; // 0 * 2**64
int128 constant _0_3 = 5534023222112865484; // 0.3 * 2**64
int128 constant _0_4 = 7378697629483820646; // 0.4 * 2**64
int128 constant _0_45 = 8301034833169298227; // 0.45 * 2**64
int128 constant _0_49 = 9038904596117680291; // 0.49 * 2**64
int128 constant _0_499 = 9204925292781066256; // 0.499 * 2**64
int128 constant _0_501 = 9241818780928485359; // 0.501 * 2**64
int128 constant _0_5 = 9223372036854775808; // 0.5 * 2**64
int128 constant _0_51 = 9407839477591871324; // 0.51 * 2**64
int128 constant _0_55 = 10145709240540253388; // 0.55 * 2**64
int128 constant _0_6 = 11068046444225730969; // 0.6 * 2**64
int128 constant _0_75 = 13835058055282163712; // 0.75 * 2**64
int128 constant _0_8 = 14757395258967641292; // 0.8 * 2**64
int128 constant _0_9 = 16602069666338596454; // 0.9 * 2**64
int128 constant _1 = 2**64;
int128 constant _2 = 2 * 2**64;
int128 constant _3 = 3 * 2**64;
int128 constant _4 = 4 * 2**64;
int128 constant _5 = 5 * 2**64;
int128 constant _10 = 10 * 2**64;
int128 constant _16 = 16 * 2**64;

struct Tuple {
  int128 x;
  int128 y;
}

library LibTerrain {
  function getTerrainBlock(VoxelCoord memory coord) public pure returns (uint256) {
    int128[4] memory biome = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biome);
    return getTerrainBlock(coord.x, coord.y, coord.z, height, biome);
  }

  function getTerrainBlock(
    int32 x,
    int32 y,
    int32 z,
    int32 height,
    int128[4] memory biome
  ) public pure returns (uint256) {
    if (y > height) {
      if (y >= 0) return AirID;
      return WaterID;
    }

    int128 maxBiome;
    uint256 maxBiomeIndex;
    for (uint256 i; i < biome.length; i++) {
      if (biome[i] > maxBiome) {
        maxBiome = biome[i];
        maxBiomeIndex = i;
      }
    }

    if (maxBiome == 0) return DirtID;
    if (maxBiomeIndex == uint256(Biome.Desert)) return SandID;
    if (maxBiomeIndex == uint256(Biome.Mountains)) return StoneID;
    if (maxBiomeIndex == uint256(Biome.Savanna)) return GrassID;
    if (maxBiomeIndex == uint256(Biome.Forest)) return LogID;
    return AirID;
  }

  function getHeight(
    int32 x,
    int32 z,
    int128[4] memory biome
  ) public pure returns (int32) {
    // Compute perlin height
    int128 perlin999 = Perlin.noise2d(x - 550, z + 550, 999, 64);
    int128 continentalHeight = continentalness(perlin999);
    int128 terrainHeight = Math.mul(perlin999, _10);
    int128 perlin49 = Perlin.noise2d(x, z, 49, 64);
    terrainHeight = Math.add(terrainHeight, Math.mul(perlin49, _5));
    terrainHeight = Math.add(terrainHeight, Perlin.noise2d(x, z, 13, 64));
    terrainHeight = Math.div(terrainHeight, _16);

    // Compute biome height
    int128 height = Math.mul(biome[uint256(Biome.Mountains)], mountains(terrainHeight));
    height = Math.add(height, Math.mul(biome[uint256(Biome.Desert)], desert(terrainHeight)));
    height = Math.add(height, Math.mul(biome[uint256(Biome.Forest)], forest(terrainHeight)));
    height = Math.add(height, Math.mul(biome[uint256(Biome.Savanna)], savanna(terrainHeight)));
    height = Math.div(height, Math.add(Math.add(Math.add(Math.add(biome[0], biome[1]), biome[2]), biome[3]), _1));

    height = Math.add(continentalHeight, Math.div(height, _2));

    // Create valleys
    int128 valley = valleys(Math.div(Math.add(Math.mul(Perlin.noise2d(x, z, 333, 64), _2), perlin49), _3));
    height = Math.mul(height, valley);

    // Scale height
    return int32(Math.muli(height, 256) - 128);
  }

  function getBiome(int32 x, int32 z) public pure returns (int128[4] memory) {
    int128 heat = Perlin.noise2d(x + 222, z + 222, 444, 64);
    int128 humidity = Perlin.noise(z, x, 999, 333, 64);

    Tuple memory biomeVector = Tuple(humidity, heat);
    int128[4] memory biome;

    biome[uint256(Biome.Mountains)] = pos(
      Math.mul(Math.sub(_0_75, euclidean(biomeVector, getBiomeVector(Biome.Mountains))), _2)
    );

    biome[uint256(Biome.Desert)] = pos(
      Math.mul(Math.sub(_0_75, euclidean(biomeVector, getBiomeVector(Biome.Desert))), _2)
    );

    biome[uint256(Biome.Forest)] = pos(
      Math.mul(Math.sub(_0_75, euclidean(biomeVector, getBiomeVector(Biome.Forest))), _2)
    );

    biome[uint256(Biome.Savanna)] = pos(
      Math.mul(Math.sub(_0_75, euclidean(biomeVector, getBiomeVector(Biome.Savanna))), _2)
    );

    return biome;
  }

  function getBiomeVector(Biome biome) internal pure returns (Tuple memory) {
    if (biome == Biome.Mountains) return Tuple(_0, _0);
    if (biome == Biome.Desert) return Tuple(_0, _1);
    if (biome == Biome.Forest) return Tuple(_1, _0);
    if (biome == Biome.Savanna) return Tuple(_1, _1);
    revert("unknown biome");
  }

  ///////////////////////
  // Utils
  ///////////////////////

  // return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  function euclidean(Tuple memory a, Tuple memory b) public pure returns (int128) {
    return Math.sqrt(Math.add(Math.pow(Math.sub(a.x, b.x), 2), Math.pow(Math.sub(a.y, b.y), 2)));
  }

  function euclideanVec(int128[] memory a, int128[] memory b) public pure returns (int128) {
    return euclidean(Tuple(a[0], a[1]), Tuple(b[0], b[1]));
  }

  function euclideanRaw(
    int128 a0,
    int128 a1,
    int128 b0,
    int128 b1
  ) public pure returns (int128) {
    return euclidean(Tuple(a0, a1), Tuple(b0, b1));
  }

  function pos(int128 x) internal pure returns (int128) {
    return x < 0 ? int128(0) : x;
  }

  ///////////////////////
  // Spline functions
  ///////////////////////

  function applySpline(int128 x, Tuple[] memory splines) internal pure returns (int128) {
    Tuple[2] memory points;

    // Find spline points
    if (splines.length == 2) {
      points = [splines[0], splines[1]];
    } else {
      for (uint256 index; index < splines.length; index++) {
        if (splines[index].x >= x) {
          points = [splines[index - 1], splines[index]];
          break;
        }
      }
    }

    int128 t = Math.div(Math.sub(x, points[0].x), Math.sub(points[1].x, points[0].x));
    return Perlin.lerp(t, points[0].y, points[1].y);
  }

  function continentalness(int128 x) public pure returns (int128) {
    Tuple[] memory splines = new Tuple[](3);
    splines[0] = Tuple(_0, _0);
    splines[1] = Tuple(_0_5, _0_5);
    splines[2] = Tuple(_1, _0_5);
    return applySpline(x, splines);
  }

  function mountains(int128 x) public pure returns (int128) {
    Tuple[] memory splines = new Tuple[](4);
    splines[0] = Tuple(_0, _0);
    splines[1] = Tuple(_0_3, _0_4);
    splines[2] = Tuple(_0_6, _2);
    splines[3] = Tuple(_1, _4);
    return applySpline(x, splines);
  }

  function desert(int128 x) public pure returns (int128) {
    Tuple[] memory splines = new Tuple[](2);
    splines[0] = Tuple(_0, _0);
    splines[1] = Tuple(_1, _0_4);
    return applySpline(x, splines);
  }

  function forest(int128 x) public pure returns (int128) {
    Tuple[] memory splines = new Tuple[](2);
    splines[0] = Tuple(_0, _0);
    splines[1] = Tuple(_1, _0_5);
    return applySpline(x, splines);
  }

  function savanna(int128 x) public pure returns (int128) {
    Tuple[] memory splines = new Tuple[](2);
    splines[0] = Tuple(_0, _0);
    splines[1] = Tuple(_1, _0_4);
    return applySpline(x, splines);
  }

  function valleys(int128 x) public pure returns (int128) {
    Tuple[] memory splines = new Tuple[](8);
    splines[0] = Tuple(_0, _1);
    splines[1] = Tuple(_0_45, _1);
    splines[2] = Tuple(_0_49, _0_9);
    splines[3] = Tuple(_0_499, _0_8);
    splines[4] = Tuple(_0_501, _0_8);
    splines[5] = Tuple(_0_51, _0_9);
    splines[6] = Tuple(_0_55, _1);
    splines[7] = Tuple(_1, _1);
    return applySpline(x, splines);
  }
}
