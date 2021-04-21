import { Observable } from "@nativescript/core";
interface Workerish {
    postMessage: (msg: any) => void;
    on: (event: string, callback: (event: any) => void) => void;
}
export declare class LocalOfflineMapBehavior extends Observable implements Workerish {
    private _worker;
    constructor(config: any);
    setWorker(worker: Worker): void;
    postMessage(msg: any): void;
}
export {};
