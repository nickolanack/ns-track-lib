import { MapView } from "nativescript-google-maps-sdk";
import { GroundOverlayFeatureBase, GroundOverlay } from "./GroundOverlayFeatureBase";
export declare class GroundOverlayFeature extends GroundOverlayFeatureBase {
    private _map;
    private _groundOverlay;
    ios: GMSGroundOverlay;
    constructor(map: MapView, overlay: GroundOverlay);
    hide(): this;
    show(): this;
    setOpacity(number: number): this;
}
