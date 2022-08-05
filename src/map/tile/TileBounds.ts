
import { _isArray } from 'tns-mobile-data-collector/src/utils';

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

export const coordinateBounds = (coordinates: CoordinateBounds): Bounds => {


	let north = -Infinity, south = Infinity, east = -Infinity, west = Infinity;

	coordinates.forEach((c) => {

		north = Math.max(c[0], north);
		south = Math.min(c[0], south);

		east = Math.max(c[1], east);
		west = Math.min(c[1], west);

	});

	return <Bounds>{
		north: north,
		south: south,
		east: east,
		west: west
	};



};


export const lngToX = (lng: Longitude, zoom: number, tileSize?: number): XTile => {
	const TILE_SIZE = tileSize || 256;
	const scale = 1 << zoom;
	const worldCoordinateX = TILE_SIZE * (0.5 + lng / 360);

	return Math.floor(worldCoordinateX * scale / TILE_SIZE);
};

export const latToY = (lat: Latitude, zoom: number, tileSize?: number): YTile => {

	const TILE_SIZE = tileSize || 256;
	const scale = 1 << zoom;
	let siny = Math.sin(lat * Math.PI / 180);

	// Truncating to 0.9999 effectively limits latitude to 89.189. This is
	// about a third of a tile past the edge of the world tile.
	siny = Math.min(Math.max(siny, -0.9999), 0.9999);
	const worldCoordinateY = TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI));
	return Math.floor(worldCoordinateY * scale / TILE_SIZE);

};

export const latLngToXY = (lat: Latitude, lng: Longitude, zoom: number, tileSize?: number): [XTile, YTile] => {
	const TILE_SIZE = tileSize || 256;
	const scale = 1 << zoom;
	const worldCoordinateX = TILE_SIZE * (0.5 + lng / 360);

	let x = Math.floor(worldCoordinateX * scale / TILE_SIZE);
	let siny = Math.sin(lat * Math.PI / 180);

	// Truncating to 0.9999 effectively limits latitude to 89.189. This is
	// about a third of a tile past the edge of the world tile.
	siny = Math.min(Math.max(siny, -0.9999), 0.9999);
	const worldCoordinateY = TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI));
	let y = Math.floor(worldCoordinateY * scale / TILE_SIZE);

	return [x, y];

};



export const tileRangeAtZoom = (bounds: Bounds, z: number): TileRange => {


	return {

		x: <[XTile, XTile]>([lngToX(bounds.west, z), lngToX(bounds.east, z)]).sort(),
		y: <[YTile, YTile]>([latToY(bounds.south, z), latToY(bounds.north, z)]).sort()
	};

};


export class TileBounds {

	private _tileRanges: Array<TileRange> = [];
	private _bounds: Bounds;

	constructor(boundary: Bounds | CoordinateBounds) {


		if (_isArray(boundary) && _isArray(boundary[0])) {
			this._bounds = coordinateBounds(<CoordinateBounds>boundary);
		} else {
			this._bounds = <Bounds>boundary;
		}

		console.log("Tile Bounds:");
		console.log(this._bounds);

	}


	public contains(x: XTile, y: YTile, z: number) {

		if (!(this._tileRanges.length > z && this._tileRanges[z])) {
			this._tileRanges[z] = tileRangeAtZoom(this._bounds, z);
		}

		if (x < this._tileRanges[z].x[0] || x > this._tileRanges[z].x[1]) {
			return false;
		}
		if (y < this._tileRanges[z].y[0] || y > this._tileRanges[z].y[1]) {
			return false;
		}

		return true;
	}

}