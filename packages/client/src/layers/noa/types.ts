import { createNoaLayer } from "./createNoaLayer";

export type NoaLayer = Awaited<ReturnType<typeof createNoaLayer>>;

export type Material = {
  color?: [number, number, number];
  textureUrl?: string;
};

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
  opaque?: boolean;
  fluid?: boolean;
  solid?: boolean;
};
