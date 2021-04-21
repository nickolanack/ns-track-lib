
import { ImageSource } from "@nativescript/core";
import { MapView } from "nativescript-google-maps-sdk";
import { GroundOverlayFeatureBase, GroundOverlay } from "./GroundOverlayFeatureBase";


export class GroundOverlayFeature extends GroundOverlayFeatureBase {

	private _map: MapView;
	private _groundOverlay: any|com.google.android.gms.maps.model.GroundOverlay;
	private _groundOverlayOptions: com.google.android.gms.maps.model.GroundOverlayOptions;

	public android: any|com.google.android.gms.maps.model.GroundOverlay;

	constructor(map: MapView, overlay: GroundOverlay) {
		super();
		this._map = map;

		const image = ImageSource.fromFileOrResourceSync(overlay.image);

		const bounds = new com.google.android.gms.maps.model.LatLngBounds(
			new com.google.android.gms.maps.model.LatLng(overlay.south, overlay.west), // South west corner
			new com.google.android.gms.maps.model.LatLng(overlay.north, overlay.east)); // North east corner
		const groundOverlayOptions = (new com.google.android.gms.maps.model.GroundOverlayOptions())
			.image(com.google.android.gms.maps.model.BitmapDescriptorFactory.fromBitmap(image.android))
			.positionFromBounds(bounds)
			.bearing(-overlay.rotation)
			.transparency(1 - (typeof overlay.opacity == 'number' ? Math.max(0, Math.min(overlay.opacity, 1)) : 0.7));

		this._groundOverlayOptions = groundOverlayOptions;
	}

	public hide() {
		this._groundOverlay.remove();
		this._groundOverlay = null;
		return this;
	}

	public show() {
		this._groundOverlay = this._map.gMap.addGroundOverlay(this._groundOverlayOptions);
		this.android = this._groundOverlay;
		return this;
	}

	public setOpacity(zoom: number) {
		if (this._groundOverlay) {
			this._groundOverlay.transparency = (1 - (typeof zoom == 'number' ? Math.max(0, Math.min(zoom, 1)) : 1));
		}

		// set this too, so opacity persists after hide/show
		this._groundOverlayOptions.transparency(1 - (typeof zoom == 'number' ? Math.max(0, Math.min(zoom, 1)) : 1));
		return this;
	}
}