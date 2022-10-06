import { formatEntityID } from "@latticexyz/network";
import { Coord, padToBitLength, to256BitString, toInt32 } from "@latticexyz/utils";

export function getStakeEntity(chunk: Coord, entity: string) {
  return formatEntityID(
    to256BitString(entity) +
      padToBitLength(toInt32(chunk.x).toString(16), 32).substring(2) +
      padToBitLength(toInt32(chunk.y).toString(16), 32).substring(2)
  );
}
