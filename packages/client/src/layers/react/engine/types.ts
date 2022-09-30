import React from "react";
import { Observable } from "rxjs";
import { Layers } from "../../../types";

export type GridConfiguration = { colStart: number; colEnd: number; rowStart: number; rowEnd: number };

export interface UIComponent<T = unknown> {
  gridConfig: GridConfiguration;
  requirement(layers: Layers): Observable<T>;
  Render: React.FC<NonNullable<T>>;
}
