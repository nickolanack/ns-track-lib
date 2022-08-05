
import { extend } from 'tns-mobile-data-collector/src/utils';
import {Permission} from 'tns-mobile-data-collector/src/Permission';
import { Enums , Observable, EventData } from '@nativescript/core';
import { Options as LocationOptions } from '@nativescript/geolocation';


interface LocationEvent extends EventData {
	location: any;
}


import { distanceToLatSpanAt, distanceToLngSpanAt, toCoordinate, distance, Coordinate } from './spatial/Spherical';

interface GeofenceOptions {
	latlng: LocationResult;
	radius: number;
	rect?: boolean;
}

interface LocationResult {
	latitude: Latitude;
	longitude: Longitude;
	altitude: Altitude;
}

declare type Coord = [Latitude, Longitude];

declare type LocationLike= LocationResult | {lat: number, lng: number}| Coord;

declare type Latitude = number;
declare type Longitude = number;
declare type Altitude = number;

interface Bounds {
	north: Latitude;
	south: Latitude;
	east: Longitude;
	west: Longitude;
}
class Geofence extends Observable {

	private _bounds: Bounds = null;
	private _inBounds: boolean = false;
	private _options: GeofenceOptions = null;

	private _distance: number = Infinity; // only computed if options.rect is false
	private _location: Coordinate;

	public constructor(options: GeofenceOptions) {

		super();

		this._options = extend({
			rect: true
		}, options);

		const loc = toCoordinate(this._options.latlng);
		this._location = loc;

		const latSpan = distanceToLatSpanAt(loc.lat, options.radius);
		const lngSpan = distanceToLngSpanAt(loc.lat, options.radius);

		this._bounds = {
			north: loc.lat + latSpan,
			south: loc.lat - latSpan,
			east: loc.lng + lngSpan,
			west: loc.lng - lngSpan
		};

	}

	public remove() {
		this.off('enter');
		this.off('exit');
	}

	public locationInBounds(location: LocationLike): boolean {

		location = toCoordinate(location);

		if (location.lat >= this._bounds.south && location.lat <= this._bounds.north) {

			if (location.lng >= this._bounds.west && location.lng <= this._bounds.east) {



				if (this._options.rect) {
					return true;
				}
				this._distance = distance(location, toCoordinate(this._options.latlng));
				if (this._distance <= this._options.radius) {
					return true;
				}


			}

		}

		return false;

	}

	public updateLocation(location: LocationLike) {

		let loc = toCoordinate(location);
		if (this.locationInBounds(loc)) {

			if (!this._inBounds) {
				this._inBounds = true;
				this.notify({
					eventName: "enter",
					object: this,
					bounds: this._bounds,
					location: loc,
					distance: this._distance,
					geofence: {
						location: this._location,
						radius: this._options.radius
					}

				});

			}
			return;
		}


		if (this._inBounds) {
			this._inBounds = false;
			this.notify({
				eventName: "exit",
				object: this,
				bounds: this._bounds,
				location: loc,
				distance: this._distance,
				geofence: {
					location: this._location,
					radius: this._options.radius
				}

			});

		}

	}


}



export class Location extends Observable {


	private _geolocation: any = null;
	private _currentWatchObserverNumber: any = null;
	private _geofenceList: Array<any> = [];
	private _watchLocationOptions: any;
	private _currentWatchInterval: any = null;
	private _lastUpdate: number = 0;

	public constructor() {
		super();
	}

	public getPosition(options?: LocationOptions) {

		return new Promise((resolve, reject) => {

			let timeout = options && options.timeout ? options.timeout : 5000;

			let interval = setTimeout(() => {
				if (
					this._geolocation) {
					this.clearWatch();
				}
				reject('get position timeout: ' + timeout);
			}, timeout);

			this.watchLocation((loc: LocationResult) => {
				this.clearWatch();
				clearTimeout(interval);
				resolve(loc);
			}, options);

		});

	}


	public addGeofence(latlng, radius, callback: (inBounds: boolean, eventData: any) => void) {

		if (this._geofenceList.length == 0) {
			this.on('location', (event: LocationEvent) => {
				this._geofenceList.forEach((g: Geofence) => {
					g.updateLocation(event.location);
				});
			});
		}


		const geofence = new Geofence({
			latlng: latlng,
			radius: radius
		});

		geofence.on("enter", function(eventData) {
			callback(true, eventData);
		});

		geofence.on("exit", function(eventData) {
			callback(false, eventData);
		});

		this._geofenceList.push(geofence);


	}

	public clearWatch() {

		if (!this._geolocation) {
			throw 'No geolocation object';
		}

		this._geolocation.clearWatch(this._currentWatchObserverNumber);
		this.off('location');
		this._geolocation = null;
		this._currentWatchObserverNumber = null;


		this._geofenceList.forEach((g: Geofence) => {
			g.remove();
		});
		this._geofenceList = [];

		clearInterval(this._currentWatchInterval);
	}

	public watchLocation(callback?: (location: any) => void, options?: LocationOptions) {


		if ((!options) && typeof callback != 'function') {
			options = <LocationOptions>callback;
			callback = null;
		}

		if (callback) {
			this.on("location", (event: LocationEvent) => {
				callback(event.location);
			});
		}

		if (this._geolocation || this._currentWatchObserverNumber) {
			throw 'Only allows one watcher';
		}


		(new Permission()).requirePermissionFor('gps').then((object) => {



			let locationOptions: LocationOptions = extend({
				desiredAccuracy: Enums.Accuracy.any,
				updateDistance: 1,
				minimumUpdateTime: 1000 * 5
			}, options);


			this._watchLocationOptions = locationOptions;

			this._geolocation = object.geolocation;
			this._currentWatchObserverNumber = this._geolocation.watchLocation(
				(loc: LocationResult) => {

					if (loc) {

						this._lastUpdate = (new Date()).getTime();

						this.notify({
							eventName: "location",
							object: this,
							location: loc
						});

					}

				},
				(e) => {

					console.error("Location Error");
					console.error(e);
					// getLocation();
				}, locationOptions);


			this.startCurrentLocationInterval();


		}).catch((e) => {
			console.error("Location Permission Error: " + JSON.stringify(e.message || e));
			console.error(e);
			// getLocation();
		});


	}


	private startCurrentLocationInterval() {



		this._geolocation.getCurrentLocation({
			desiredAccuracy: this._watchLocationOptions.desiredAccuracy,
			maximumAge: 5000,
			timeout: 20000
		}).then((loc: LocationResult) => {
			if (loc) {

				this._lastUpdate = (new Date()).getTime();

				this.notify({
					eventName: "location",
					object: this,
					location: loc
				});

			}

		}).catch(console.error);


		if (!this._currentWatchInterval) {

			this._currentWatchInterval = setInterval(() => {

				if ((new Date()).getTime() - this._lastUpdate > 15000) {
					this.startCurrentLocationInterval();
				}


			}, 10000);
		}

	}




}