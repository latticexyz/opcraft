import { BehaviorSubject, concat, distinctUntilKeyChanged, map, Observable, of } from "rxjs";
import { ZoomLevel } from "./constants";

export const createZoomLevel = (zoom$: Observable<number>) => {
  const zoomLevel$ = new BehaviorSubject({ zoom: 1, zoomLevel: ZoomLevel.X1, zoomMultiplier: 1 });
  concat(of(1), zoom$)
    .pipe(
      map((zoom) => {
        if (zoom < 1 / 32) return { zoom, zoomLevel: ZoomLevel.X16, zoomMultiplier: 16 };
        if (zoom < 1 / 16) return { zoom, zoomLevel: ZoomLevel.X8, zoomMultiplier: 8 };
        if (zoom < 1 / 8) return { zoom, zoomLevel: ZoomLevel.X4, zoomMultiplier: 4 };
        if (zoom < 1 / 4) return { zoom, zoomLevel: ZoomLevel.X2, zoomMultiplier: 2 };
        return { zoom, zoomLevel: ZoomLevel.X1, zoomMultiplier: 1 };
      }),
      distinctUntilKeyChanged("zoomLevel")
    )
    .subscribe(zoomLevel$);

  return zoomLevel$;
};
