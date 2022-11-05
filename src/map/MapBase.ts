"use strict";

import { Color, isAndroid, isIOS, ImageSource, Image, Observable, EventData} from '@nativescript/core';


import { MapView, Position, Marker, Polyline, Polygon, Bounds } from 'nativescript-google-maps-sdk';


import { extend, _isArray, _isObject, getConfiguration, requestPermissions } from 'tns-mobile-data-collector/src/utils';

import { MapModes } from './MapModes';

import { Layer } from './Layer';
import { LayerLoader } from './LayerLoader';
import { FeatureLoader } from './FeatureLoader';

import { MapActionButtons } from './MapActionButtons';

import { StreetView } from './streetView/StreetView';

import { ViewRenderer } from 'tns-mobile-data-collector/src/ViewRenderer';

import * as MapViewRenderer from "ns-track-lib/src/MapViewRenderer";

export interface ShapeEventData extends EventData {
	shape:any
}

export interface MarkerEventData extends EventData {
	marker:any
}

export interface LayerEventData extends EventData {
	layer:Layer
}





export abstract class MapBase extends Observable {

	protected _map: MapView;
	protected _options: any;
	protected _renderer: any;
	protected _layerObjects: Array<any> = [];
	protected _mapModes: MapModes;
	protected _mapActionButons: any | MapActionButtons;

	protected _layers: Array<any> | null = null;
	protected _layerLoader:LayerLoader;

	constructor(map, options) {
		super();
		let me = this;
		me._map = map;

		me._options = extend({}, options);

		me._renderer = ViewRenderer.SharedInstance();

		map.on("mapReady", (event) => {


			me._map = map;

			me._mapModes = new MapModes();


			me._renderer.addActionHandler("map.setNormal", () => {
				me.setMapType("normal");
			});
			me._renderer.addActionHandler("map.setHybrid", () =>{
				me.setMapType("hybrid");
			});
			me._renderer.addActionHandler("map.setSatellite", () => {
				me.setMapType("satellite");
			});
			me._renderer.addActionHandler("map.setTerrain", () => {
				me.setMapType("terrain");
			});
			me._renderer.addActionHandler("map.toggleType", () =>{
				me.toggleMapType();
			});


			me._renderer.addActionHandler("map.showStreetView", () => {
				me.showStreetView();
			});



			me._renderer.addListResolver("map.layers", () => {



				return new Promise((resolve) => {

					resolve((this._layerLoader.getLayers()).map((l, i) => {
						return {
							name: l.getName(),
							description: l.getDescription(),
							index: i,
							visible: l.isVisible()
						};
					}).filter((l) => {

						if (typeof l.name == "string") {

							this._renderer.addActionHandler("map.toggleLayer." + l.index, () => {
								this._layerLoader.getLayers()[l.index].toggleVisibility();
							});


							return true;
						}
						return false;
					}));

				});

			});


			me._renderer.addListResolver("map.types", () => {

				return new Promise((resolve) => {

					resolve((["normal", "hybrid", "terrain"]).map((l, i) => {
						return {
							name: l,
							index: i,
							active: true
						};
					}));

				});

			});


			me.notify(event);


			console.log('MapBase Ready');


		});

		map.once('mapReady', function() {
			me._initMap();
		});



		map.on("markerSelect", function(event:MarkerEventData) {
			me.notify(event);
		});


		map.on("cameraChanged", function(event) {
			me.notify(event);
		});


		map.on("markerInfoWindowTapped", function(event) {
			me.notify(event);
		});
		map.on("shapeSelect", function(event:ShapeEventData) {
			me.notify(event);
		});
		map.on("markerBeginDragging", function(event) {
			me.notify(event);
		});
		map.on("markerEndDragging", function(event) {
			me.notify(event);
		});
		map.on("markerDrag", function(event) {
			me.notify(event);
		});


		map.on("coordinateTapped", function(event) {
			me.notify(event);
		});
		map.on("coordinateLongPress", function(event) {
			me.notify(event);
		});
		map.on("myLocationTapped", function(event) {
			me.notify(event);
		});

	}


	public showStreetView() {

		MapViewRenderer.SharedInstance().showStreetView();

	}

	public getLayers() {
		return this._layerObjects.slice(0);
	}

	public getMapView() {
		return this._map;
	}

	public resetMapView(callback?): Promise<void> {

		return this.setZoomAndCenter(this._options.zoom, this._options.center, callback);

	}

	public abstract setZoomAndCenter(zoom: number, pos: Array<number>, callback?): Promise<void>;
	public abstract setCenter(pos: Array<number>, callback?): Promise<void>;
	public abstract getCenter(): Array<number>;

	public abstract setMapTypeNone();
	public abstract setMapType(type: string);

	public abstract getBoundsPoly(): Array<any>;
	public abstract getZoom(): number;
	public abstract setZoom(zoom: number, callback?): Promise<void>;

	public fitBounds(bounds:any, pad?){

		return new Promise((resolve, reject)=>{

			let southwest=Position.positionFromLatLng(bounds.south, bounds.west);
			let northeast=Position.positionFromLatLng(bounds.north, bounds.east);

			this._map.setViewport(Bounds.fromCoordinates(southwest, northeast), pad||0);

		});


	}


	public toggleMapType = function() {

		let types = ["normal", /* "satellite",*/ "hybrid", "terrain"];

		if(typeof this._type=='undefined'){
			this._type=types[0];
		}

		this.setMapType(types[(types.indexOf(this._type) + 1) % types.length]);


	};

	public getMapModes() {
		return this._mapModes;
	}

	public getLocation = function() {
		let me = this;
	};

	public addAction = function(name, fn) {
		this._renderer.addActionHandler("map." + name, fn);
	};

	public getActionName = function(name): string {

		return "map." + name;
	};

	public setActionButtons = function(actionButtons) {
		this._mapActionButons = actionButtons;
	};

	public getActionButtons(): MapActionButtons {
		return this._mapActionButons;
	}


	public _readJson(path) {


		return new Promise((resolve, reject) => {


			(new (require('./kml/KmlLoader').KmlLoader)()).fromPathOrUrl(path).then((kmlContent) => {

				console.log("got kml string");
				resolve(kmlContent);
			}).catch((e) => {
				console.log("failed to render heatmap");
			});

		});

	}


	public loadLayers(){

		this._layerLoader=new LayerLoader(this._options);
		this._layerLoader.setMap(this._map).loadLayers(this._layers, (layer, list)=>{

			this._layerObjects.push(layer);

			list.forEach((item, i) => {


				console.log('MapBase.Add Layer Item: ' + item.typ);

				this.notify({
					eventName:"addLayer",
					layer:layer,
					object:this
				});


				if ((!item.type) || item.type == "marker") {
					this.addMarker(item).then((marker) => {
						layer.addItem(marker, item);
					}).catch(console.error);
				}
				if (item.type == "image") {
					this.addGroundOverlay(item).then((groundOverlay) => {
						layer.addItem(groundOverlay, item);
					}).catch(console.error);
				}
				if (item.type == "tile") {
					this.addTileLayer(item).then((tileLayer) => {
						layer.addItem(tileLayer, item);
					}).catch(console.error);
				}

				if (item.type == "tileset") {
					this.addTilesetLayer(item).then((tileLayer) => {
						layer.addItem(tileLayer, item);
					}).catch(console.error);
				}


				if (item.type == "kml" || item.type == "kml.heatmap") {

					const KmlFeature = require('./kml/KmlFeature').KmlFeature;


					this.notify({
						eventName:'initKmlReader',
						layer:layer,
						kmlReader:KmlFeature,
						object:this,
						item:item,
						itemIndex:i
					});

					
					if(isIOS&&item.type=='kml'){

						/**
						 * TODO: ?? should make this the default for all kml. not just ios?
						 */

						KmlFeature.ReadKmlWorker(this, item.kml||item.url).then((feature)=>{
							layer.addItem(feature, item);
						});
						return;
					}


					KmlFeature.ReadKml(item.kml||item.url).then((kmlLayerContent) => {

						if (item.type == "kml") {
							layer.addItem(new KmlFeature(this, kmlLayerContent), item);
						}

						if (item.type == "kml.heatmap") {
							layer.addItem(new (require('./heatmap/HeatMapFeature').HeatMapFeature)(this._map, kmlLayerContent), item);
						}

					

					}).catch(console.error);

					return;
				}


				if (item.type == "json") {

					const JsonFeature = require('./json/JsonFeature').JsonFeature;
					JsonFeature.ReadJson(item.json).then((jsonLayer) => {
						layer.addItem(new JsonFeature(this, jsonLayer), item);
					}).catch(console.error);
				}

				if (item.type == "traffic") {
					layer.addItem(new (require("./TrafficFeature"))(this._map), item);
				}

				if (item.type == "indoor") {
					layer.addItem(new (require("./floorplan/FloorPlanFeature").FloorPlanFeature)(this._map), item);
				}

				if (item.type == "buildings") {
					layer.addItem(new (require("./Buildings3DFeature"))(this._map), item);
				}

			});
		});


	}


	public removeMarker(marker) {
		let me = this;
		me._map.removeMarker(marker);
		this.notify({
			eventName: 'removeFeature',
			object: this,
			item: marker,
			type: "marker"
		});
	}


	public addMarker(item) {

		return (new FeatureLoader()).loadMarker(item).then((marker:Marker)=>{
			this._map.addMarker(marker);
			this.notify({
				eventName: 'addFeature',
				object: this,
				item: marker,
				type: "marker"
			});

			return marker;
		});


	}

	public setIcon(marker: Marker, image) {

		return (new FeatureLoader()).setIcon(marker, image);

	}

	public selectMarker(item) {
		let me = this;
		(<any>me._map).notifyMarkerTapped(item);
	}

	public selectLine(item) {
		let me = this;
		(<any>me._map).notifyShapeTapped(item);
	}


	public addGroundOverlay(item) {

		let me = this;
		return Promise.resolve(new (require('./ground/GroundOverlayFeature').GroundOverlayFeature)(me._map, item));

	}

	public addTileLayer(item) {

		let me = this;

		return Promise.resolve(new (require('./tile/TileFeature').TileFeature)(me._map, item));


	}

	public addTilesetLayer(item) {

		let me = this;
		return Promise.resolve(new (require('./tile/TilesetFeature').TilesetFeature)(me._map, item));


	}


	public setPosition(marker, point) {

		let me = this;
		marker.position = Position.positionFromLatLng(point[0], point[1]);
		marker.userData.coordinates = point;


		me.notify({
			eventName: 'updateFeature',
			object: marker,
			type: "marker"
		});
	}


	public addLine(item) {


		if (item instanceof Polyline) {
			this._map.addPolyline(item);
			this.notify({
				eventName: 'addFeature',
				object: this,
				item: item,
				type: "line"
			});
			return Promise.resolve(item);
		}

		let me = this;
		// return new Promise(function(resolve, reject){

		let mapView = me._map;


		// console.log("Render Feature: "+JSON.stringify(item, null, '   '));

		let line = new Polyline();


		return new Promise(function(resolve) {

			line.addPoints(item.coordinates.map(function(point) {
				return Position.positionFromLatLng(point[0], point[1]);
			}));

			line.userData = extend({}, item);

			// line.title = item.name;

			if (typeof item.clickable == 'boolean') {
				line.clickable = item.clickable;
			}
			// marker.snippet = item.description;

			line.width = typeof item.width == "number" ? item.width : 1;
			line.color = item.color ? (typeof item.color == "string" ? new Color(item.color) : item.color) : new Color('black');




			mapView.addPolyline(line);


			me.notify({
				eventName: 'addFeature',
				object: me,
				item: line,
				type: "line"
			});

			console.log('add line');

			resolve(line);

		});
	}

	public addPolygon(item): Promise<Polygon> {


		if (item instanceof Polygon) {
			this._map.addPolygon(item);
			this.notify({
				eventName: 'addFeature',
				object: this,
				item: item,
				type: "polygon"
			});
			return Promise.resolve(item);
		}


		let me = this;
		// return new Promise(function(resolve, reject){

		let mapView = me._map;


		// console.log("Render Feature: "+JSON.stringify(item, null, '   '));

		let poly = new Polygon();


		return new Promise<Polygon>(function(resolve) {

			poly.addPoints(item.coordinates.map(function(point) {
				return Position.positionFromLatLng(point[0], point[1]);
			}));

			poly.userData = extend({}, item);

			// poly.title = item.name;

			if (typeof item.clickable == 'boolean') {
				poly.clickable = item.clickable;
			}
			// marker.snippet = item.description;

			poly.strokeWidth = typeof item.lineWidth == "number" ? item.lineWidth : 1;
			poly.strokeColor = item.lineColor ? (typeof item.lineColor == "string" ? new Color(item.lineColor) : item.lineColor) : new Color('black');
			poly.fillColor = item.fillColor ? (typeof item.fillColor == "string" ? new Color(item.fillColor) : item.fillColor) : new Color(100, 0, 0, 0);




			mapView.addPolygon(poly);


			me.notify({
				eventName: 'addFeature',
				object: me,
				item: poly,
				type: "polygon"
			});

			console.log('add polygon');

			resolve(poly);

		});
	}
	public removePolygon(poly) {
		this._map.removeShape(poly);
		this.notify({
			eventName: 'removeFeature',
			object: this,
			item: poly,
			type: "polygon"
		});
	}
	public removeLine(line) {
		this._map.removeShape(line);
		this.notify({
			eventName: 'removeFeature',
			object: this,
			item: line,
			type: "line"
		});
	}
	public addPointToLine(line, point) {

		let me = this;

		line.addPoint(Position.positionFromLatLng(point[0], point[1]));
		line.userData.coordinates[line.getPoints().length - 1] = point;

		me.notify({
			eventName: 'updateFeature',
			object: line,
			type: "line"
		});

	}
	public updateLinePointAt(line, index, point) {
		let p = line.getPoints();
		p[index] = Position.positionFromLatLng(point[0], point[1]);
		line.removeAllPoints();
		line.addPoints(p);
	}
	public reverseLinePoints(line) {
		let p = line.getPoints();
		p.reverse();
		line.removeAllPoints();
		line.addPoints(p);
	}


	public removeLinePointAt(line, index) {
		let p = line.getPoints();
		p.splice(index, 1); // =Position.positionFromLatLng(point[0], point[1]);
		line.removeAllPoints();
		if (p.length == 1) {
			// on ios (at least) the line is not redrawn from 2 to 1 point! so draw line on itself
			line.addPoints([p[0], p[0]]);
			line.removeAllPoints();
		}
		line.addPoints(p);
	}

	private _initMap() {
		console.log('On Map Ready');
		let me = this;

		let mapView = me._map;

		if (me._options.mapType && me._options.mapType != "normal") {
			me.setMapType(me._options.mapType);
		}


		if (me._options.center[0] !== 0) {
			console.log('set initial map view');
			mapView.latitude = me._options.center[0];
			mapView.longitude = me._options.center[1];
			mapView.zoom = me._options.zoom;
		}

		requestPermissions()
			.then((granted) =>{
				if (granted) {
					console.log("Enabling My Location..");
					mapView.myLocationEnabled = true;
					mapView.settings.myLocationButtonEnabled = true;

					//zoom to location?

					return;
				}
				console.log('Location not granted');
			}).catch((e)=>{
				console.error(e);
			});


		mapView.settings.indoorLevelPickerEnabled = true;

		mapView.settings.compassEnabled = true;
		mapView.settings.mapToolbarEnabled = true;

		mapView.settings.rotateGesturesEnabled = true;
		mapView.settings.scrollGesturesEnabled = true;
		mapView.settings.tiltGesturesEnabled = true;

		mapView.settings.zoomControlsEnabled = true;
		mapView.settings.zoomGesturesEnabled = true;


		me.loadLayers();

		console.log('Map Initialization Complete');
	}

}