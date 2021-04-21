import {Application} from "@nativescript/core";
import {KmlFeatureBase} from "./KmlFeatureBase";

export class KmlFeature extends KmlFeatureBase {

	private _layer: any;
	public android: any;
	private _kml: string;
	private _map: any;

	constructor(map, kmlString) {

		super();
		this._kml = kmlString;
		this._map = map;

	}

	private _init() {

		return this.resolveKml(this._kml).then((kmlString) => {
			this._kml = null;

			const context = Application.android.context;
			const layer = new com.google.maps.android.data.kml.KmlLayer(this._map.gMap, new java.io.ByteArrayInputStream((new java.lang.String(kmlString)).getBytes()), context);
			this._layer = layer;
			this.android = layer;
			return kmlString;
		});
	}

	public hide() {
		if (!this._layer) {
			return this;
		}
		this._layer.removeLayerFromMap();
		return this;
	}
	public show() {

		if (!this._layer) {
			this._init().then(() => {
				this.show();
			}).catch((e) => {
				console.error('Failed to init kml');
				console.error(e);
			});
			return;
		}

		this._layer.addLayerToMap();
		return this;
	}

}