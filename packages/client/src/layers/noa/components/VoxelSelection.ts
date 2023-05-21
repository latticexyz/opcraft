import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineVoxelSelectionComponent(world: World) {
  return defineComponent(
    world,
    {
      points: Type.T, // the type is an array of voxelcoords
    },
    { id: "VoxelSelectionComponent" }
  );
}
