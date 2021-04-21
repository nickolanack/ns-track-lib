
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

			let list = [];

			const parser = new KmlParser(this._kmlString);

			this._kmlString = null; // free mem

			parser.parseMarkers((marker) => {
				list.push(GMUWeightedLatLng.alloc().initWithCoordinateIntensity(CLLocationCoordinate2DMake(marker.coordinates[0], marker.coordinates[1]), 1.0));
			});


			this._tileOverlay = GMUHeatmapTileLayer.new();
			this._tileOverlay.weightedData = list;
		}


		this._tileOverlay.map = this._map.nativeView;
		return this;
	}



	public setOpacity = function(opacity) {
		this._tileOverlay.opacity = Math.max(0, Math.min(opacity, 1));
		return this;
	};

	public hide = function() {
		this._tileOverlay.map = null;
		return this;
	};

}