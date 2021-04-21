import { StreetViewBase } from "./StreetViewBase";
export declare class StreetView extends StreetViewBase {
    protected panorama: com.google.android.gms.maps.StreetViewPanoramaView | null;
    setCenter(pos: Array<number>, callback?: any): Promise<void>;
    createNativeView(): any;
    initStreetView(): void;
    initNativeView(): void;
    onLoaded(): void;
    onUnloaded(): void;
    private onActivityPaused;
    private onActivityResumed;
    disposeNativeView(): void;
    private onActivitySaveInstanceState;
    private onActivityDestroyed;
}
