import { Mesh } from "@babylonjs/core";

export const POSITION_COMPONENT = "position";
export const MESH_COMPONENT = "mesh";
export interface MeshComponent {
  mesh: Mesh;
  offset: number[];
}
export interface PositionComponent {
  position: null | number[];
  width: number;
  height: number;
  _localPosition: null | number[];
  _renderPosition: null | number[];
  _extents: null | number[];
}
