

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

export const lngAddDistance = (lat1: Latitude, lon1: Longitude, d: Meters): Longitude => {

	let R = 6371000; // metres
	let c = d / R;

	let lon2 = lon1 + toDegrees(c) / Math.cos(toRadians(lat1));
	return lon2;
};

export const distanceToLngSpanAt = (lat1: Latitude, d: Meters) => {
	let R = 6371000; // metres
	let c = d / R;

	return toDegrees(c) / Math.cos(toRadians(lat1));
};


export const latAddDistance = (lat1: Latitude, d: Meters): Latitude => {

	let R = 6371000; // metres
	let c = d / R;

	let lat2 = lat1 + toDegrees(c);
	return lat2;

};


export const distanceToLatSpanAt = (lat1: Latitude, d: Meters) => {
	let R = 6371000; // metres
	let c = d / R;

	return toDegrees(c);
};


export const toRadians = (deg: Degrees): Radians => {
	return deg * (Math.PI / 180.0);
};
export const toDegrees = (rad: Radians): Degrees => {
	return rad * (180.0 / Math.PI);
};



/**
 * returns the bearing in degrees from north
 * @type {Degrees}
 */
export const bearing = (c1: Coordinate|Coord, c2: Coordinate|Coord): Degrees => {

	c1 = toCoordinate(c1);
	c2 = toCoordinate(c2);

	const lat1 = c1.lat;
	const lon1 = c1.lng;
	const lat2 = c2.lat;
	const lon2 = c2.lng;

	const φ1 = toRadians(lat1);
	const φ2 = toRadians(lat2);
	const λ1 = toRadians(lon1);
	const λ2 = toRadians(lon2);

	const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
	const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
	const brng = toDegrees(Math.atan2(y, x));
	return brng;
};

interface LatitudeLongitude {
	latitude: number;
	longitude: number;
}

export const toCoordinate = (c: LatitudeLongitude|Coordinate|Coord): Coordinate => {

	if ((<LatitudeLongitude>c).latitude || typeof (<LatitudeLongitude>c).latitude == "number") {
		return {
			lat: (<LatitudeLongitude>c).latitude,
			lng: (<LatitudeLongitude>c).longitude
		};
	}


	return {
		lat: (<Coordinate>c).lat || typeof (<Coordinate>c).lat == "number" ? (<Coordinate>c).lat : c[0],
		lng: (<Coordinate>c).lng || typeof (<Coordinate>c).lng == "number" ? (<Coordinate>c).lng : c[1]
	};

};

export const distance = (c1: Coordinate|Coord, c2: Coordinate|Coord): Meters => {

	c1 = toCoordinate(c1);
	c2 = toCoordinate(c2);

	const lat1 = c1.lat;
	const lon1 = c1.lng;
	const lat2 = c2.lat;
	const lon2 = c2.lng;


	const R = 6371000; // metres
	const φ1 = toRadians(lat1);
	const φ2 = toRadians(lat2);
	const Δφ = toRadians(lat2 - lat1);
	const Δλ = toRadians(lon2 - lon1);

	const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) *
		Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	const d = R * c;
	return d;
};





let lngSpanDistanceCalc = function(lat1, lon1, lon2) {
	let R = 6371000; // metres
	let φ1 = toRadians(lat1);
	let φ2 = φ1;
	let Δλ = toRadians(lon2 - lon1);

	let a = Math.cos(φ1) * Math.cos(φ2) *
		Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	let d = R * c;
	return d;
};



let latSpanDistanceCalc = function(lat1, lat2) {
	let R = 6371000; // metres
	let φ1 = toRadians(lat1);
	let Δφ = toRadians(lat2 - lat1);
	let Δλ = 0;

	let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2);
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	let d = R * c;
	return d;
};


export const distanceVector = (c1: Coordinate|Coord, c2: Coordinate|Coord) => {

	c1 = toCoordinate(c1);
	c2 = toCoordinate(c2);
	let x = lngSpanDistanceCalc(c1.lat, c1.lng, c2.lng);
	let z = latSpanDistanceCalc(c1.lat, c2.lat);

	return {x: x, y: 0, z: z};
};

export const toVector = function(direction: Degrees, magnitude: Meters): Vector3 {

	return {
		x: magnitude * Math.sin(toRadians(direction)),
		y: 0,
		z: -1 * magnitude * Math.cos(toRadians(direction))
	};

};