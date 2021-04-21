declare type Latitude = number;
declare type Longitude = number;
interface Bounds {
    north: Latitude;
    south: Latitude;
    east: Longitude;
    west: Longitude;
}
declare type XTile = number;
declare type YTile = number;
interface TileRange {
    x: [XTile, XTile];
    y: [YTile, YTile];
}
declare type CoordinateBounds = Array<[Latitude, Longitude]>;
export declare const coordinateBounds: (coordinates: CoordinateBounds) => Bounds;
export declare const lngToX: (lng: Longitude, zoom: number, tileSize?: number) => XTile;
export declare const latToY: (lat: Latitude, zoom: number, tileSize?: number) => YTile;
export declare const latLngToXY: (lat: Latitude, lng: Longitude, zoom: number, tileSize?: number) => [XTile, YTile];
export declare const tileRangeAtZoom: (bounds: Bounds, z: number) => TileRange;
export declare class TileBounds {
    private _tileRanges;
    private _bounds;
    constructor(boundary: Bounds | CoordinateBounds);
    contains(x: XTile, y: YTile, z: number): boolean;
}
export {};
