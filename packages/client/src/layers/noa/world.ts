import { namespaceWorld } from "@latticexyz/recs";
import { world as networkWorld } from "../network/world";

export const world = namespaceWorld(networkWorld, "noa");
