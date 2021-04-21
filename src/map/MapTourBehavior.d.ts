import { MapBase as Map } from './MapBase';
import { TourBehavior } from './TourBehavior';
export declare class MapTourBehavior extends TourBehavior {
    private _map;
    private _lines;
    private _lineSections;
    private _lineDecorator;
    constructor(map: Map, options?: any);
    protected startTour(): void;
    protected focusTourStep(index: any): void;
    protected endTour(): void;
    protected getVisibleItemLocationData(tourItem: any, callback: any): void;
    protected getItemLabel(tourItem: any, callback: any): void;
}
