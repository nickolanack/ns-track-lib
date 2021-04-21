
import { ImageSource } from "@nativescript/core";
import { MapView } from "nativescript-google-maps-sdk";
import { GroundOverlayFeatureBase, GroundOverlay } from "./GroundOverlayFeatureBase";


export class GroundOverlayFeature extends GroundOverlayFeatureBase {

	private _map: MapView;
	private _groundOverlay: GMSGroundOverlay;
	public ios: GMSGroundOverlay;

	constructor(map: MapView, overlay: GroundOverlay) {
		super();
		this._map = map;

		const image = ImageSource.fromFileOrResourceSync(overlay.image);

		const southWest = CLLocationCoordinate2DMake(overlay.south, overlay.west);
		const northEast = CLLocationCoordinate2DMake(overlay.north, overlay.east);
		const overlayBounds = GMSCoordinateBounds.alloc().initWithCoordinateCoordinate(southWest, northEast);
		const groundOverlay = GMSGroundOverlay.groundOverlayWithBoundsIcon(overlayBounds, image.ios);
		groundOverlay.bearing = -overlay.rotation;

		groundOverlay.opacity = typeof overlay.opacity == 'number' ? Math.max(0, Math.min(overlay.opacity, 1)) : 1;
		groundOverlay.map = map.nativeView;

		this._groundOverlay = groundOverlay;
		this.ios = groundOverlay;

	}

	public hide() {
		this._groundOverlay.map = null;
		return this;
	}

	public show() {
		this._groundOverlay.map = this._map.nativeView;
		return this;
	}

	public setOpacity(zoom: number) {
		this._groundOverlay.opacity = typeof zoom == 'number' ? Math.max(0, Math.min(zoom, 1)) : 1;
		return this;
	}
}