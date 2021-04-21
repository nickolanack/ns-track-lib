import { MapBase } from './MapBase';
export declare class Map extends MapBase {
    constructor(map: any, options: any);
    getBoundsPoly(): number[][];
    getCenter(): Array<number>;
    setCenter(pos: Array<number>, callback?: any): Promise<void>;
    setZoomAndCenter(number: number, pos: Array<number>, callback?: any): Promise<void>;
    getZoom(): number;
    setZoom(number: any, callback?: any): Promise<void>;
    setMapTypeNone(): void;
    setMapType: (type: any) => void;
}
