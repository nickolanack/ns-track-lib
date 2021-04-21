
import {Polyline, Polygon} from 'nativescript-google-maps-sdk';
import {MapBase as Map} from '../MapBase';
import {Screen} from "@nativescript/core";

export class LineStyler {

	private _line: Polyline|Polygon;

	constructor(line: Polyline|Polygon, map: Map) {

		this._line = line;
	}

	public setPattern(pattern: Array<string>) {

		console.log('set pattern');


		let list = new java.util.ArrayList();
		let scale = Screen.mainScreen.scale;

		pattern.map((p) => {

			if (p == 'dot') {
				return new com.google.android.gms.maps.model.Dash(scale * 4);
				// return new com.google.android.gms.maps.model.Dot();
			}
			if (p == 'gap') {
				return new com.google.android.gms.maps.model.Gap(scale * 4);
			}
			return new com.google.android.gms.maps.model.Dash(scale * 8);
		}).forEach((item) => {
			list.add(item);
		});

		if (this._line.shape == "polygon") {

			this._line.android.strokePattern(list);
			return;
		}
		this._line.android.pattern(list);

	}


	public updatePattern(pattern: Array<string>) {

	}

}