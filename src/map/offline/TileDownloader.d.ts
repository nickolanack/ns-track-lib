import { BoundsPoly } from './OfflineTileDownloadManager';
import { Observable } from "@nativescript/core";
export declare class TileDownloader extends Observable {
    private _boundsPoly;
    private _bounds;
    private _zoomRange;
    private _countTiles;
    private _sizeEstimateMB;
    private _downloaded;
    private _downloadedSizeB;
    private _currentTile;
    private _folder;
    constructor(boundsPoly: BoundsPoly);
    private getPath;
    private getUrl;
    private iterateAsync;
    private iterateValues;
    private delay;
    private getDetails;
    private calculateTileDetails;
    private countTiles;
    private getTileRangeAt;
    private calculateFitZoom;
    private getBounds;
    private lngToX;
    private latToY;
    cancel(): void;
}
