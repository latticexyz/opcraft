// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { Perlin } from "noise/Perlin.sol";
import { ABDKMath64x64 as Math } from "abdk-libraries-solidity/ABDKMath64x64.sol";
import { Biome } from "../constants.sol";

int128 constant _0_75 = 13835058055282163712; // 0.75 * 2**64
int128 constant _2 = 2 * 2**64;

library LibTerrain {
  function getBiome(int32 x, int32 z) public pure returns (int128[4] memory) {
    int128 heat = Perlin.noise(x + 222, z + 222, 0, 444, 64);
    int128 humidity = Perlin.noise(z, x, 999, 333, 64);

    int128[2] memory biomeVector = [humidity, heat];
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

  function getBiomeVector(Biome biome) internal pure returns (int128[2] memory) {
    if (biome == Biome.Mountains) return [Math.fromUInt(0), Math.fromUInt(0)];
    if (biome == Biome.Desert) return [Math.fromUInt(0), Math.fromUInt(1)];
    if (biome == Biome.Forest) return [Math.fromUInt(1), Math.fromUInt(0)];
    if (biome == Biome.Savanna) return [Math.fromUInt(1), Math.fromUInt(1)];
    revert("unknown biome");
  }

  // return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  function euclidean(int128[2] memory a, int128[2] memory b) internal pure returns (int128) {
    return Math.sqrt(Math.pow(Math.sub(a[0], b[0]), 2) + Math.pow(Math.sub(a[1], b[1]), 2));
  }

  function pos(int128 x) internal pure returns (int128) {
    return x < 0 ? int128(0) : x;
  }
}
