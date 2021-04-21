
import {Polyline, Polygon, Position, MapView} from 'nativescript-google-maps-sdk';
import {MapBase as Map} from '../MapBase';
import {Screen} from "@nativescript/core";

export class LineStyler {

	private _line: Polyline|Polygon;
	private _polygonOutline: any|Polyline;
	private _map: Map;
	private _mapView: MapView;
	private _zoom;

	constructor(line: Polyline|Polygon, map: Map) {

		this._line = line;
		this._map = map;
		this._mapView = map.getMapView();



	}

	public setPattern(pattern: Array<string>) {

		console.log('set pattern');


		this.updatePattern(pattern);

		this._mapView.on("cameraChanged", (event) => {
			if (this._zoom != this._mapView.gMap.camera.zoom) {
				this.updatePattern(pattern);
			}
		});

	}


	public updatePattern(pattern: Array<string>) {

		this._zoom = this._mapView.gMap.camera.zoom;

		let styles = [];
		let lengths = [];
		let scale = Screen.mainScreen.scale * 12742000 / (256 * Math.pow(2, this._zoom));

		if (this._line.shape == "polygon") {

			let poly = <Polygon>this._line;


			this._map.addLine({
				width: poly.strokeWidth,
				color: poly.strokeColor,
				coordinates: this._line.getPoints().concat(this._line.getPoints().slice(0, 1)).map((p: Position) => {
					return [p.latitude, p.longitude];
				})
			}).then((line) => {
				new LineStyler(line, this._map).setPattern(pattern);
			});
			poly.strokeWidth = 0;

			return;
		}


		pattern.forEach((p) => {

			if (p == 'dot') {
				styles.push(GMSStrokeStyle.solidColor(this._line.ios.strokeColor));
				lengths.push(2 * scale);
				return;
			}
			if (p == 'gap') {
				styles.push(GMSStrokeStyle.solidColor(UIColor.clearColor));
				lengths.push(2 * scale);
				return;
			}

			// dash

			styles.push(GMSStrokeStyle.solidColor(this._line.ios.strokeColor));
			lengths.push(8 * scale);
		});





		this._line.ios.spans = GMSStyleSpans(this._line.ios.path, styles, lengths, kGMSLengthRhumb);


	}


}