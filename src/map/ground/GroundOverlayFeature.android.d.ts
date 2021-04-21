import { MapView } from "nativescript-google-maps-sdk";
import { GroundOverlayFeatureBase, GroundOverlay } from "./GroundOverlayFeatureBase";
export declare class GroundOverlayFeature extends GroundOverlayFeatureBase {
    private _map;
    private _groundOverlay;
    private _groundOverlayOptions;
    android: any | com.google.android.gms.maps.model.GroundOverlay;
    constructor(map: MapView, overlay: GroundOverlay);
    hide(): this;
    show(): this;
    setOpacity(number: number): this;
}
