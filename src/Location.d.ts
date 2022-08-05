import { Observable } from "@nativescript/core";
import { Options as LocationOptions } from '@nativescript/geolocation';
export declare class Location extends Observable {
    private _geolocation;
    private _currentWatchObserverNumber;
    private _geofenceList;
    private _watchLocationOptions;
    private _currentWatchInterval;
    private _lastUpdate;
    constructor();
    getPosition(options?: LocationOptions): Promise<unknown>;
    addGeofence(latlng: any, radius: any, callback: (inBounds: boolean, eventData: any) => void): void;
    clearWatch(): void;
    watchLocation(callback?: (location: any) => void, options?: LocationOptions): void;
    private startCurrentLocationInterval;
}
