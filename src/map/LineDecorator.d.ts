import { Observable } from "@nativescript/core";
import { Polyline, Polygon } from 'nativescript-google-maps-sdk';
export declare class LineDecorator extends Observable {
    private _config;
    private _map;
    private _currentLine;
    private _currentLinePoints;
    private _currentLineStart;
    private _currentLineEnd;
    private _selected;
    private _next;
    constructor(map: any, line: any, options: any);
    select(marker: any): void;
    isVertexSelected(index: any): boolean;
    reverse(): void;
    addPoint(coordinate: any): void;
    clearSelected(): void;
    getLine(): Polyline | Polygon;
    isVertex(item: any): boolean;
    splice(point: any): any;
    selectNext(): void;
    update(): any;
    remove(): void;
}
