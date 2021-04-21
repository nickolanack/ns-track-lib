import { Observable } from "@nativescript/core";
export interface BoundsPoly {
    _id: string;
    coordinates: Array<Array<number>>;
}
export declare class OfflineTileDownloadManager extends Observable {
    private _postmessage;
    private _dataName;
    private _tileDownloaders;
    private _isPaused;
    constructor(postmessage: (msg: any) => void);
    private _onConnectionType;
    private _useMobileData;
    private _pauseDownloads;
    private _resumeDownloads;
    hasDownloaders(): boolean;
    private _queueBounds;
    private _listBounds;
    private postMessage;
    onmessage(msg: any): void;
}
