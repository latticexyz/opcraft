// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import { Perlin } from "noise/Perlin.sol";
import { ABDKMath64x64 as Math } from "abdk-libraries-solidity/ABDKMath64x64.sol";
import { Biome, STRUCTURE_CHUNK, STRUCTURE_CHUNK_CENTER } from "../constants.sol";
import { AirID, GrassID, DirtID, LogID, StoneID, SandID, WaterID, CobblestoneID, CoalID, CraftingID, IronID, GoldID, DiamondID, LeavesID, PlanksID, RedFlowerID, GrassPlantID, OrangeFlowerID, MagentaFlowerID, LightBlueFlowerID, LimeFlowerID, PinkFlowerID, GrayFlowerID, LightGrayFlowerID, CyanFlowerID, PurpleFlowerID, BlueFlowerID, GreenFlowerID, BlackFlowerID, KelpID, WoolID, SnowID, ClayID, BedrockID } from "../prototypes/Blocks.sol";
import { VoxelCoord } from "../types.sol";
import { div } from "../utils.sol";

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

  function _getTerrainBlock(
    int32,
    int32 y,
    int32,
    int32 height,
    int128[4] memory biome
  ) public pure returns (uint256) {
    if (y > height + 1) {
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
    if (maxBiomeIndex == uint256(Biome.Desert)) {
      if (y == height + 1) {
        return KelpID;
      }
      return SandID;
    }

    if (maxBiomeIndex == uint256(Biome.Mountains)) return StoneID;

    if (maxBiomeIndex == uint256(Biome.Savanna)) {
      if (y == height + 1) {
        return RedFlowerID;
      }
      return GrassID;
    }

    if (maxBiomeIndex == uint256(Biome.Forest)) return LogID;
    return AirID;
  }

  function getTerrainBlock(
    int32 x,
    int32 y,
    int32 z,
    int32 height,
    int128[4] memory biomeValues
  ) public pure returns (uint256) {
    uint256 blockID;

    blockID = Bedrock(y);
    if (blockID != 0) return blockID;

    blockID = Water(y, height);
    if (blockID != 0) return blockID;

    blockID = Air(y, height);
    if (blockID != 0) return blockID;

    uint8 biome = getMaxBiome(biomeValues);

    blockID = Diamond(x, y, z, height, biome);
    if (blockID != 0) return blockID;

    blockID = Coal(x, y, z, height, biome);
    if (blockID != 0) return blockID;

    int32 distanceFromHeight = height - y;

    blockID = Sand(y, height, biome, distanceFromHeight);
    if (blockID != 0) return blockID;

    blockID = Snow(y, height, biomeValues[uint256(Biome.Mountains)]);
    if (blockID != 0) return blockID;

    blockID = Grass(y, height, biome);
    if (blockID != 0) return blockID;

    blockID = Stone(y, height, biome);
    if (blockID != 0) return blockID;

    blockID = Clay(y, height, biome, distanceFromHeight);
    if (blockID != 0) return blockID;

    blockID = Dirt(y, height, biome);
    if (blockID != 0) return blockID;

    blockID = Structure(x, y, z, height, biome);
    if (blockID != 0) return blockID;

    blockID = SmallPlant(x, y, z, height, biome);
    if (blockID != 0) return blockID;

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

  function getMaxBiome(int128[4] memory biomeValues) public pure returns (uint8 biome) {
    int128 maxBiome;
    for (uint256 i; i < biomeValues.length; i++) {
      if (biomeValues[i] > maxBiome) {
        maxBiome = biomeValues[i];
        biome = uint8(i);
      }
    }
  }

  function getBiomeVector(Biome biome) internal pure returns (Tuple memory) {
    if (biome == Biome.Mountains) return Tuple(_0, _0);
    if (biome == Biome.Desert) return Tuple(_0, _1);
    if (biome == Biome.Forest) return Tuple(_1, _0);
    if (biome == Biome.Savanna) return Tuple(_1, _1);
    revert("unknown biome");
  }

  function getCoordHash(int32 x, int32 z) public pure returns (uint16) {
    uint256 hash = uint256(keccak256(abi.encode(x, z)));
    return uint16(hash % 1024);
  }

  function getChunkCoord(int32 x, int32 z) public pure returns (int32, int32) {
    return (div(x, STRUCTURE_CHUNK), div(z, STRUCTURE_CHUNK));
  }

  function getChunkOffsetAndHeight(
    int32 x,
    int32 y,
    int32 z
  ) internal pure returns (int32 height, VoxelCoord memory offset) {
    (int32 chunkX, int32 chunkZ) = getChunkCoord(x, z);
    int32 chunkCenterX = chunkX * STRUCTURE_CHUNK + STRUCTURE_CHUNK_CENTER;
    int32 chunkCenterZ = chunkZ * STRUCTURE_CHUNK + STRUCTURE_CHUNK_CENTER;
    int128[4] memory biome = getBiome(chunkCenterX, chunkCenterZ);
    height = getHeight(chunkCenterX, chunkCenterZ, biome);
    offset = VoxelCoord(x - chunkX * STRUCTURE_CHUNK, y - height, z - chunkZ * STRUCTURE_CHUNK);
  }

  function getBiomeHash(
    int32 x,
    int32 y,
    uint8 biome
  ) public pure returns (uint16) {
    return getCoordHash(div(x, 300) + div(y, 300), int32(uint32(biome)));
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Utils
  //////////////////////////////////////////////////////////////////////////////////////

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

  function coordEq(VoxelCoord memory a, uint8[3] memory b) internal pure returns (bool) {
    return a.x == int32(uint32(b[0])) && a.y == int32(uint32(b[1])) && a.z == int32(uint32(b[2]));
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Spline functions
  //////////////////////////////////////////////////////////////////////////////////////

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

  //////////////////////////////////////////////////////////////////////////////////////
  // Block occurrence functions
  //////////////////////////////////////////////////////////////////////////////////////

  function Air(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    return Air(coord.y, height);
  }

  function Air(int32 y, int32 height) internal pure returns (uint256) {
    if (y >= height + 2 * STRUCTURE_CHUNK) return AirID;
  }

  function Water(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    return Water(coord.y, height);
  }

  function Water(int32 y, int32 height) internal pure returns (uint256) {
    if (y < 0 && y >= height) return WaterID;
  }

  function Bedrock(VoxelCoord memory coord) internal pure returns (uint256) {
    return Bedrock(coord.y);
  }

  function Bedrock(int32 y) internal pure returns (uint256) {
    if (y <= -63) return BedrockID;
  }

  function Sand(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    uint8 biome = getMaxBiome(biomeValues);
    return Sand(coord.y, height, biome, height - coord.y);
  }

  function Sand(
    int32 y,
    int32 height,
    uint8 biome,
    int32 distanceFromHeight
  ) internal pure returns (uint256) {
    if (y >= height) return 0;

    if (biome == uint8(Biome.Desert) && y >= -20) return SandID;

    if (y >= 2) return 0;

    if (biome == uint8(Biome.Savanna) && distanceFromHeight <= 4) return SandID;
    if (biome == uint8(Biome.Forest) && distanceFromHeight <= 2) return SandID;
  }

  function Diamond(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    uint8 biome = getMaxBiome(biomeValues);
    return Diamond(coord.x, coord.y, coord.z, height, biome);
  }

  function Diamond(
    int32 x,
    int32 y,
    int32 z,
    int32 height,
    uint8 biome
  ) internal pure returns (uint256) {
    if (y >= height) return 0;

    if ((biome == uint8(Biome.Savanna) || biome == uint8(Biome.Forest) || biome == uint8(Biome.Forest)) && y >= -20)
      return 0;

    uint16 hash = getCoordHash(x, z);
    if (hash > 10) return 0;

    hash = getCoordHash(y, x + z);
    if (hash <= 10) return DiamondID;
  }

  function Coal(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    uint8 biome = getMaxBiome(biomeValues);
    return Coal(coord.x, coord.y, coord.z, height, biome);
  }

  function Coal(
    int32 x,
    int32 y,
    int32 z,
    int32 height,
    uint8 biome
  ) internal pure returns (uint256) {
    if (y >= height) return 0;

    if ((biome == uint8(Biome.Savanna) || biome == uint8(Biome.Forest) || biome == uint8(Biome.Forest)) && y >= -20)
      return 0;

    uint16 hash = getCoordHash(x, z);
    if (hash <= 10 || hash > 50) return 0;

    hash = getCoordHash(y, x + z);
    if (hash > 10 && hash <= 50) return CoalID;
  }

  function Snow(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    return Snow(coord.y, height, biomeValues[uint8(Biome.Mountains)]);
  }

  function Snow(
    int32 y,
    int32 height,
    int128 mountainBiome
  ) internal pure returns (uint256) {
    if (y >= height) return 0;
    if ((y > 55 || mountainBiome > _0_6) && y == height - 1) return SnowID;
  }

  function Stone(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    uint8 biome = getMaxBiome(biomeValues);
    return Stone(coord.y, height, biome);
  }

  function Stone(
    int32 y,
    int32 height,
    uint8 biome
  ) internal pure returns (uint256) {
    if (y >= height) return 0;

    if ((biome == uint8(Biome.Savanna) || biome == uint8(Biome.Forest) || biome == uint8(Biome.Desert)) && y >= -20)
      return 0;

    return StoneID;
  }

  function Clay(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    uint8 biome = getMaxBiome(biomeValues);
    return Clay(coord.y, height, biome, height - coord.y);
  }

  function Clay(
    int32 y,
    int32 height,
    uint8 biome,
    int32 distanceFromHeight
  ) internal pure returns (uint256) {
    if (y >= height) return 0;
    if (biome == uint8(Biome.Savanna) && y < 2 && distanceFromHeight <= 6) return ClayID;
  }

  function Grass(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    uint8 biome = getMaxBiome(biomeValues);
    return Grass(coord.y, height, biome);
  }

  function Grass(
    int32 y,
    int32 height,
    uint8 biome
  ) internal pure returns (uint256) {
    if (y >= height) return 0;
    if (y < 0) return 0;

    if ((biome == uint8(Biome.Savanna) || biome == uint8(Biome.Forest)) && y == height - 1) return GrassID;
    if (biome == uint8(Biome.Mountains) && y < 40 && y == height - 1) return GrassID;
  }

  function Dirt(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    uint8 biome = getMaxBiome(biomeValues);
    return Dirt(coord.y, height, biome);
  }

  function Dirt(
    int32 y,
    int32 height,
    uint8 biome
  ) internal pure returns (uint256) {
    if (y >= height) return 0;
    if (biome == uint8(Biome.Savanna) || biome == uint8(Biome.Forest)) return DirtID;
  }

  function SmallPlant(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    uint8 biome = getMaxBiome(biomeValues);
    return SmallPlant(coord.x, coord.y, coord.z, height, biome);
  }

  function SmallPlant(
    int32 x,
    int32 y,
    int32 z,
    int32 height,
    uint8 biome
  ) internal pure returns (uint256) {
    if (y != height) return 0;

    uint16 hash = getCoordHash(x, z);

    if (biome == uint8(Biome.Desert)) {
      if (hash < 5) return GreenFlowerID;
      if (hash > 990) return KelpID;
    }

    if (biome == uint8(Biome.Savanna)) {
      if (hash < 5) return RedFlowerID;
      if (hash < 10) return OrangeFlowerID;
      if (hash < 15) return MagentaFlowerID;
      if (hash < 20) return LimeFlowerID;
      if (hash < 25) return PinkFlowerID;
      if (hash < 30) return CyanFlowerID;
      if (hash < 35) return PurpleFlowerID;
      if (hash >= 900) return GrassPlantID;
    }

    if (biome == uint8(Biome.Forest)) {
      if (hash < 5) return BlueFlowerID;
      if (hash < 10) return LightGrayFlowerID;
      if (hash < 15) return GrassPlantID;
    }

    if (biome == uint8(Biome.Mountains)) {
      if (y > 55 && hash < 5) return GrayFlowerID;
      if (y <= 55 && hash < 10) return LightBlueFlowerID;
      if (y <= 55 && hash < 15) return BlackFlowerID;
    }
  }

  function Structure(VoxelCoord memory coord) internal pure returns (uint256) {
    int128[4] memory biomeValues = getBiome(coord.x, coord.z);
    int32 height = getHeight(coord.x, coord.z, biomeValues);
    uint8 biome = getMaxBiome(biomeValues);
    return Structure(coord.x, coord.y, coord.z, height, biome);
  }

  function Structure(
    int32 x,
    int32 y,
    int32 z,
    int32 height,
    uint8 biome
  ) internal pure returns (uint256) {
    if (y < height || y < 0) return 0;

    if (biome == uint8(Biome.Mountains) || biome == uint8(Biome.Desert)) return 0;

    (int32 chunkX, int32 chunkZ) = getChunkCoord(x, z);
    uint16 hash = getCoordHash(chunkX, chunkZ);

    if (biome == uint8(Biome.Savanna) && hash < 50) {
      (int32 chunkHeight, VoxelCoord memory chunkOffset) = getChunkOffsetAndHeight(x, y, z);
      if (chunkHeight <= 0) return 0;
      uint16 biomeHash = getBiomeHash(x, z, biome);
      return hash < biomeHash / 40 ? WoolTree(chunkOffset) : Tree(chunkOffset);
    }

    if (biome == uint8(Biome.Forest) && hash < 200) {
      (int32 chunkHeight, VoxelCoord memory chunkOffset) = getChunkOffsetAndHeight(x, y, z);
      if (chunkHeight <= 0) return 0;
      uint16 biomeHash = getBiomeHash(x, z, biome);
      return hash < biomeHash / 10 ? WoolTree(chunkOffset) : Tree(chunkOffset);
    }
  }

  function Tree(VoxelCoord memory offset) internal pure returns (uint256) {
    // Trunk
    if (coordEq(offset, [3, 0, 3])) return LogID;
    if (coordEq(offset, [3, 1, 3])) return LogID;
    if (coordEq(offset, [3, 2, 3])) return LogID;
    if (coordEq(offset, [3, 3, 3])) return LogID;

    // Leaves

    if (coordEq(offset, [2, 3, 3])) return LeavesID;
    if (coordEq(offset, [3, 3, 2])) return LeavesID;
    if (coordEq(offset, [4, 3, 3])) return LeavesID;
    if (coordEq(offset, [3, 3, 4])) return LeavesID;
    if (coordEq(offset, [2, 3, 2])) return LeavesID;
    if (coordEq(offset, [4, 3, 4])) return LeavesID;
    if (coordEq(offset, [2, 3, 4])) return LeavesID;
    if (coordEq(offset, [4, 3, 2])) return LeavesID;
    if (coordEq(offset, [2, 4, 3])) return LeavesID;
    if (coordEq(offset, [3, 4, 2])) return LeavesID;
    if (coordEq(offset, [4, 4, 3])) return LeavesID;
    if (coordEq(offset, [3, 4, 4])) return LeavesID;
    if (coordEq(offset, [3, 4, 3])) return LeavesID;
    return 0;
  }

  function WoolTree(VoxelCoord memory offset) internal pure returns (uint256) {
    // Trunk
    if (coordEq(offset, [3, 0, 3])) return LogID;
    if (coordEq(offset, [3, 1, 3])) return LogID;
    if (coordEq(offset, [3, 2, 3])) return LogID;
    if (coordEq(offset, [3, 3, 3])) return LogID;

    // Leaves
    if (coordEq(offset, [2, 2, 3])) return WoolID;
    if (coordEq(offset, [3, 2, 2])) return WoolID;
    if (coordEq(offset, [4, 2, 3])) return WoolID;
    if (coordEq(offset, [3, 2, 4])) return WoolID;
    if (coordEq(offset, [2, 3, 3])) return WoolID;
    if (coordEq(offset, [3, 3, 2])) return WoolID;
    if (coordEq(offset, [4, 3, 3])) return WoolID;
    if (coordEq(offset, [3, 3, 4])) return WoolID;
    if (coordEq(offset, [2, 3, 2])) return WoolID;
    if (coordEq(offset, [4, 3, 4])) return WoolID;
    if (coordEq(offset, [2, 3, 4])) return WoolID;
    if (coordEq(offset, [4, 3, 2])) return WoolID;
    if (coordEq(offset, [2, 4, 3])) return WoolID;
    if (coordEq(offset, [3, 4, 2])) return WoolID;
    if (coordEq(offset, [4, 4, 3])) return WoolID;
    if (coordEq(offset, [3, 4, 4])) return WoolID;
    if (coordEq(offset, [3, 4, 3])) return WoolID;

    return 0;
  }
}
