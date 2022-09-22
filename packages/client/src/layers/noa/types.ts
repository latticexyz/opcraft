import { EntityID, EntityIndex } from "@latticexyz/recs";
import { VoxelCoord } from "@latticexyz/utils";
import {
  defineGameConfigComponent,
  defineItemComponent,
  defineItemPrototypeComponent,
  defineLoadingStateComponent,
  defineOwnedByComponent,
  definePositionComponent,
  defineRecipeComponent,
} from "../network/components";
import { defineNameComponent } from "../network/components/NameComponent";
import {
  definePlayerDirectionComponent,
  definePlayerPositionComponent,
  defineSelectedSlotComponent,
} from "./components";
import { defineCraftingTableComponent } from "./components/CraftingTable";
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

export interface API {
  getTerrainBlockAtPosition: (coord: VoxelCoord) => EntityID;
  getECSBlockAtPosition: (coord: VoxelCoord) => EntityID | undefined;
}

export interface RECS {
  SelectedSlot: ReturnType<typeof defineSelectedSlotComponent>;
  CraftingTable: ReturnType<typeof defineCraftingTableComponent>;
  PlayerPosition: ReturnType<typeof definePlayerPositionComponent>;
  PlayerDirection: ReturnType<typeof definePlayerDirectionComponent>;
  Position: ReturnType<typeof definePositionComponent>;
  ItemPrototype: ReturnType<typeof defineItemPrototypeComponent>;
  Item: ReturnType<typeof defineItemComponent>;
  Name: ReturnType<typeof defineNameComponent>;
  OwnedBy: ReturnType<typeof defineOwnedByComponent>;
  GameConfig: ReturnType<typeof defineGameConfigComponent>;
  Recipe: ReturnType<typeof defineRecipeComponent>;
  LoadingState: ReturnType<typeof defineLoadingStateComponent>;
  SingletonEntity: EntityIndex;
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
