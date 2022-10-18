import { Component, ComponentValue, defineRxSystem, SchemaOf, updateComponent } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { NoaLayer } from "../types";

export function createTutorialSystem(network: NetworkLayer, context: NoaLayer) {
  const {
    actions: { Action },
  } = network;
  const {
    world,
    components: { Tutorial },
    SingletonEntity,
  } = context;

  function updateTutorial(update: Partial<ComponentValue<SchemaOf<typeof Tutorial>>>) {
    updateComponent(Tutorial, SingletonEntity, update);
  }

  return defineRxSystem(world, Action.update$, (update) => {
    const actionType = update.value[0]?.metadata?.actionType;
    if (actionType === "mine") updateTutorial({ mine: false });
    if (actionType === "claim") updateTutorial({ claim: false });
    if (actionType === "build") updateTutorial({ build: false });
    if (actionType === "craft") updateTutorial({ craft: false });
  });
}
