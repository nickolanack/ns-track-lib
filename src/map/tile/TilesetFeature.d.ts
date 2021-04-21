interface TimeOffsetTileset {
    url: string;
    timeOffsets: Array<number>;
}
interface Tileset {
    url?: string;
    timeOffsets?: Array<number>;
    tiles: Array<TileOptions>;
    timeout?: number;
    opacity?: number;
}
interface TileOptions {
    url: string;
}
export declare class TilesetFeature {
    private _tileSet;
    private _config;
    private _interval;
    constructor(map: any, tile: TimeOffsetTileset | Tileset);
    hide(): this;
    show(): this;
}
export {};
