import { ContentView } from "@nativescript/core";
export declare abstract class StreetViewBase extends ContentView {
    protected field: any;
    protected _renderer: any;
    constructor(field?: any);
    abstract setCenter(pos: Array<number>, callback?: any): Promise<void>;
    notifyPanoramaReady(): void;
}
