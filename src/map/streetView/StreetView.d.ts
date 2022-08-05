import { StreetViewBase } from "./StreetViewBase";
export declare class StreetView extends StreetViewBase {
    protected _delegate: GMSPanoramaViewDelegate | null;
    setCenter(pos: Array<number>, callback?: any): Promise<void>;
    createNativeView(): any;
    initStreetView(): void;
    initNativeView(): void;
    onLoaded(): void;
    onUnloaded(): void;
}
