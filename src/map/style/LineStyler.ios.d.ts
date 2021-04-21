import { Polyline, Polygon } from 'nativescript-google-maps-sdk';
import { MapBase as Map } from '../MapBase';
export declare class LineStyler {
    private _line;
    private _polygonOutline;
    private _map;
    private _mapView;
    private _zoom;
    constructor(line: Polyline | Polygon, map: Map);
    setPattern(pattern: Array<string>): void;
    updatePattern(pattern: Array<string>): void;
}
