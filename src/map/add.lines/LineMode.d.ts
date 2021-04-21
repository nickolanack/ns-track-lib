import { MapBase as Map } from '../MapBase';
import { LocalLayerData } from '../LocalLayerData';
import { Observable } from "@nativescript/core";
export declare class LineMode extends Observable {
    private _map;
    private _modes;
    private _localLayer;
    private _config;
    private _isDragging;
    private _currentLineEdit;
    private _currentLine;
    constructor(map: Map, layer: LocalLayerData, options?: any);
    _addLineTapActions(): void;
    _addLineEditor(): void;
}
