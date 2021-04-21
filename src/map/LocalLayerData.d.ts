import { MapBase as Map } from './MapBase';
import { Observable } from "@nativescript/core";
export declare class LocalLayerData extends Observable {
    private _dataName;
    private _map;
    private _markerList;
    private _lineList;
    private _polygonList;
    constructor(name: string, map: Map, options: any);
    getDataName(): string;
    _addTapActions(): void;
    hasMarker(marker: any): boolean;
    hasLine(line: any): boolean;
    hasPolygon(poly: any): boolean;
    saveMarker(item: any, fn: any): void;
    saveLine(item: any, fn: any): void;
    savePolygon(item: any, fn: any): void;
    private _saveFeatureType;
    getJsonData(): any;
    load(): void;
    deleteMarker(marker: any, fn: any): void;
    deleteLine(shape: any, fn: any): void;
    deletePolygon(shape: any, fn: any): void;
    private _deleteFeature;
}
