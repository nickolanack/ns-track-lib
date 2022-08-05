import { getConfiguration } from 'tns-mobile-data-collector/src/utils';
 
import { MapBase as Map, MarkerEventData, ShapeEventData} from './MapBase';

import { Observable } from "@nativescript/core";


export class LocalLayerData extends Observable {

	private _dataName: string;
	private _map: Map;

	private _markerList: Array<any> = [];
	private _lineList: Array<any> = [];
	private _polygonList: Array<any> = [];

	constructor(name: string, map: Map, options) {

		super();

		this._dataName = name;
		this._map = map;
		this._addTapActions();


	}

	public getDataName() {
		return this._dataName;
	}


	public _addTapActions() {

		const me = this;
		const map: Map = me._map;
		map.on("markerSelect", (event:MarkerEventData) => {
			const marker = event.marker;


			if (this.hasMarker(marker)) {
				this.notify(event);
			}


		});

		map.on("shapeSelect", (event:ShapeEventData) => {
			const shape = event.shape;


			if (this.hasLine(shape) || this.hasPolygon(shape)) {
				this.notify(event);
			}


		});


	}

	public hasMarker(marker) {
		return this._markerList.indexOf(marker) >= 0;
	}

	public hasLine(line) {
		return this._lineList.indexOf(line) >= 0;
	}

	public hasPolygon(poly) {
		return this._polygonList.indexOf(poly) >= 0;
	}


	public saveMarker(item, fn) {
		this._markerList.push(item);
		this._saveFeatureType(item, 'marker', fn);
	}

	public saveLine(item, fn) {
		this._lineList.push(item);
		this._saveFeatureType(item, 'line', fn);
	}

	public savePolygon(item, fn) {
		this._polygonList.push(item);
		this._saveFeatureType(item, 'polygon', fn);
	}


	private _saveFeatureType(item, type, callback) {


		let fn = (err, result) => {
			if (err) {
				console.error(err);
			}

			if (callback) {
				callback(err, result);
			}

			if (err) {
				return;
			}

			this.notify({
				"eventName": "save" + type[0].toUpperCase() + type.slice(1),
				object: item
			});

			this.notify({
				"eventName": "saveFeature",
				"type": type,
				object: item
			});
		};


		let local = getConfiguration().getLocalData(this._dataName, []).then((list) => {

			let isNewItem = true;
			if (item.userData._id) {

				list.map((feature) => {
					if (feature._id == item.userData._id) {
						isNewItem = false;
						return item.userData;
					}
					return feature;
				});
			}

			if (isNewItem) {
				item.userData._id = (new Date()).getTime() + "." + list.length;
				item.userData.type = type;
				list.push(item.userData);
			}



			getConfiguration().setLocalData(this._dataName, list).then(() => {
				fn(null, true);
			}).catch(fn);

		}).catch(fn);



	}


	public getJsonData() {

		return getConfiguration().getLocalData(this._dataName, []);

	}


	public load() {

		let local = getConfiguration().getLocalData(this._dataName, []).then((list) => {
			console.log("usersMapFeatures:" + JSON.stringify(list));
			list.forEach((feature) => {
				if (((!feature.type) && typeof feature.coordinates[0] == "number") || feature.type == "marker") {

					feature.clickable = true; // force clickable

					this._map.addMarker(feature).then((marker) => {
						this._markerList.push(marker);
						this.notify({
							eventName: "addMarker",
							object:this,
							marker: marker
						});
					}).catch(console.error);
				}
				if (((!feature.type) && typeof feature.coordinates[0] != "number") || feature.type == "line") {

					feature.clickable = true; // force clickable

					this._map.addLine(feature).then((line) => {
						this._lineList.push(line);
						this.notify({
							eventName: "addLine",
							object:this,
							line: line
						});
					}).catch(console.error);
				}
				if (feature.type == "polygon") {

					feature.clickable = true; // force clickable

					this._map.addPolygon(feature).then((polygon) => {
						this._polygonList.push(polygon);
						console.log('notify addPolygon');
						this.notify({
							eventName: "addPolygon",
							object:this,
							polygon: polygon
						});
					}).catch(console.error);
				}
			});
		});

	}

	public deleteMarker(marker, fn) {
		this._markerList.splice(this._markerList.indexOf(marker), 1);
		this._deleteFeature(marker, "marker", fn);

	}
	public deleteLine(shape, fn) {

		this._lineList.splice(this._lineList.indexOf(shape), 1);
		this._deleteFeature(shape, "line", fn);

	}
	public deletePolygon(shape, fn) {

		this._polygonList.splice(this._polygonList.indexOf(shape), 1);
		this._deleteFeature(shape, "polygon", fn);

	}
	private _deleteFeature(item, type, callback) {


		const fn = (err, result) => {

			if (err) {
				console.error(err);
			}

			if (callback) {
				callback(err, result);
			}

			if (err) {
				return;
			}

			this.notify({
				"eventName": "remove" + type[0].toUpperCase() + type.slice(1),
				object: item
			});

			this.notify({
				"eventName": "removeFeature",
				"type": type,
				object: item
			});
		};


		let local = getConfiguration().getLocalData(this._dataName, []).then((list) => {

			let isMissingItem = true;
			if (item.userData._id) {

				list = list.filter((feature) => {
					if (feature._id == item.userData._id) {
						isMissingItem = false;
						return false;
					}
					return true;
				});
			}

			if (isMissingItem) {
				throw 'failed to delete: not found: ' + item.userData._id;
			}



			return getConfiguration().setLocalData(this._dataName, list).then(() => {
				fn(null, true);
			}).catch(fn);

		}).catch(fn);
	}




}