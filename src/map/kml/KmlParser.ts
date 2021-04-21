
import { DOMParser } from 'xmldom';
import { KmlHelper } from './KmlHelper';

import {extend} from '../../utils';


const KmlReader = new KmlHelper();

export class KmlParser {

	private _kml: any;
	private _filters: Array<any> = [];


	constructor(kml) {

		let me = this;

		if ((typeof kml) != 'string') {
			throw 'expected kml string';
		}

		const domParser = new DOMParser();
		this._kml = domParser.parseFromString(kml);



	}
	public parseDocuments(kml, callback) {
		let me = this;
		if (!callback) {
			callback = kml;
			kml = me._kml;
		}

		let documentData = me._filter(KmlReader.ParseDomDocuments(kml));
		documentData.forEach((p, i) => {
			callback(p, kml, documentData, i);
		});
		return me;
	}
	parseFolders(kml, callback) {
		let me = this;
		if (!callback) {
			callback = kml;
			kml = me._kml;
		}
		let folderData = me._filter(KmlReader.ParseDomFolders(kml));
		folderData.forEach((p, i) => {
			callback(p, kml, folderData, i);
		});
		return me;
	}
	parseMarkers(callback);
	parseMarkers(kml: string, callback?) {
		let me = this;
		if (!callback) {
			callback = kml;
			kml = me._kml;
		}
		let markerData = me._filter(KmlReader.ParseDomMarkers(kml));
		markerData.forEach((p, i) => {
			callback(p, kml, markerData, i);
		});
		return me;
	}
	parsePolygons(callback);
	parsePolygons(kml, callback?) {
		let me = this;
		if (!callback) {
			callback = kml;
			kml = me._kml;
		}
		let polygonData = me._filter(KmlReader.ParseDomPolygons(kml));
		polygonData.forEach((p, i) => {
			callback(p, kml, polygonData, i);
		});
		return me;
	}
	parseLines(kml, callback) {
		let me = this;
		if (!callback) {
			callback = kml;
			kml = me._kml;
		}
		let lineData = me._filter(KmlReader.ParseDomLines(kml));
		lineData.forEach((p, i) => {
			callback(p, kml, lineData, i);
		});
		return me;
	}
	parseGroundOverlays(kml, callback) {
		let me = this;
		if (!callback) {
			callback = kml;
			kml = me._kml;
		}
		let overlayData = me._filter(KmlReader.ParseDomGroundOverlays(kml));
		overlayData.forEach((o, i) => {
			callback(o, kml, overlayData, i);
		});
		return me;
	}
	parseNetworklinks(kml, callback) {
		let me = this;
		if (!callback) {
			callback = kml;
			kml = this._kml;
		}
		let linkData = this._filter(KmlReader.ParseDomLinks(kml));
		linkData.forEach((p, i) => {
			callback(p, kml, linkData, i);
		});
		return this;
	}
	_filter(a) {
		let me = this;
		let filtered = [];
		if (this._filters && a && a.length) {
			a.forEach((item) => {

				let bool = true;
				me._filters.forEach((f) => {
					if (f(item) === false) {
						bool = false;
					}
				});
				if (bool) {
					filtered.push(item);
				}
			});
			return filtered;
		}
		return a;
	}
	addFilter(filter) {
		this._filters.push(filter);
		return this;
	}

}

