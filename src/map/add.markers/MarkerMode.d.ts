import { MapBase as Map } from '../MapBase';
import { LocalLayerData } from '../LocalLayerData';
export declare class MarkerMode {
    private _map;
    private _modes;
    private _currentMarker;
    private _localLayer;
    private _config;
    constructor(map: Map, layer: LocalLayerData, options?: any);
    _addMarkerTapActions(): void;
}
