
// import {parse} from 'kml-parse';
import { KmlParser } from '../kml/KmlParser';

export class HeatMapFeature {

	private _map: any;
	private _kmlString: any;
	private _tileOverlay: any;

	constructor(map, kmlString) {

		// try{
		this._map = map;
		this._kmlString = kmlString;

	}

	public show() {

		if (!this._tileOverlay) {

			let list = new java.util.ArrayList();

			const parser = new KmlParser(this._kmlString);

			this._kmlString = null; // free mem

			parser.parseMarkers((marker) => {
				list.add(new com.google.android.gms.maps.model.LatLng(marker.coordinates[0], marker.coordinates[1]));
			});

			const provider = new com.google.maps.android.heatmaps.HeatmapTileProvider.Builder()
				.data(list)
				.build();
			// Add a tile overlay to the map, using the heat map tile provider.
			this._tileOverlay = this._map.gMap.addTileOverlay(new com.google.android.gms.maps.model.TileOverlayOptions().tileProvider(provider));
		}


		this._tileOverlay.setVisible(true);
		return this;
	}

	public hide() {
		this._tileOverlay.setVisible(false);
		return this;
	}

	public setOpacity(opacity) {
		this._tileOverlay.setTransparency(1 - Math.max(0, Math.min(opacity, 1)));
		return this;
	}

}