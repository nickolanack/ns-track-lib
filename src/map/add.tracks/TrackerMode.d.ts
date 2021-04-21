import { MapBase as Map } from '../MapBase';
import { LocalLayerData } from '../LocalLayerData';
import { Observable } from "@nativescript/core";
export declare class TrackerMode extends Observable {
    private _map;
    private _modes;
    private _localLayer;
    private _config;
    private _currentLineEdit;
    private _currentLine;
    private _currentLineTracker;
    private _currentTrack;
    private _currentTrackPoints;
    private _backgroundTracking;
    constructor(map: Map, layer: LocalLayerData, options?: any);
    _addLineEditor(): void;
    _addLineTracker(): void;
}
