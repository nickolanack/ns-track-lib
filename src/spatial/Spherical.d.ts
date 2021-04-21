declare type Latitude = number;
declare type Longitude = number;
declare type Meters = number;
declare type Degrees = number;
declare type Radians = number;
export interface Coordinate {
    lat: Latitude;
    lng: Longitude;
}
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}
export declare type Coord = [Latitude, Longitude];
export declare const lngAddDistance: (lat1: Latitude, lon1: Longitude, d: Meters) => Longitude;
export declare const distanceToLngSpanAt: (lat1: Latitude, d: Meters) => number;
export declare const latAddDistance: (lat1: Latitude, d: Meters) => Latitude;
export declare const distanceToLatSpanAt: (lat1: Latitude, d: Meters) => number;
export declare const toRadians: (deg: Degrees) => Radians;
export declare const toDegrees: (rad: Radians) => Degrees;
export declare const bearing: (c1: Coordinate | Coord, c2: Coordinate | Coord) => Degrees;
interface LatitudeLongitude {
    latitude: number;
    longitude: number;
}
export declare const toCoordinate: (c: LatitudeLongitude | Coordinate | Coord) => Coordinate;
export declare const distance: (c1: Coordinate | Coord, c2: Coordinate | Coord) => Meters;
export declare const distanceVector: (c1: Coordinate | Coord, c2: Coordinate | Coord) => {
    x: number;
    y: number;
    z: number;
};
export declare const toVector: (direction: Degrees, magnitude: Meters) => Vector3;
export {};
