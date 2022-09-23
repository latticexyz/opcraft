import { EntityID } from "@latticexyz/recs";
import { VoxelCoord } from "@latticexyz/utils";
import { createNoaLayer } from "./createNoaLayer";

export type NoaLayer = Awaited<ReturnType<typeof createNoaLayer>>;

export type Material = {
  color?: [number, number, number];
  textureUrl?: string;
};

export enum NoaBlockType {
  BLOCK,
  MESH,
}

/*
 * material: can be:
 * one (String) material name
 * array of 2 names: [top/bottom, sides]
 * array of 3 names: [top, bottom, sides]
 * array of 6 names: [-x, +x, -y, +y, -z, +z]
 */
type StringOrNull = string | null;
export type Block = {
  material:
    | StringOrNull
    | [StringOrNull, StringOrNull]
    | [StringOrNull, StringOrNull, StringOrNull]
    | [StringOrNull, StringOrNull, StringOrNull, StringOrNull, StringOrNull, StringOrNull];
  type: NoaBlockType;
  frames?: number;
  opaque?: boolean;
  fluid?: boolean;
  solid?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockMesh?: any;
};
