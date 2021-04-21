import { Observable } from "@nativescript/core";
export declare class FloorPlanFeature extends Observable {
    private _map;
    private _delegate;
    constructor(map: any);
    hide(): this;
    show(): this;
    _changeActiveBuilding(building?: GMSIndoorBuilding): void;
    _changeActiveLevel(level?: GMSIndoorLevel): void;
}
