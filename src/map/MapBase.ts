"use strict";

import { Color, isAndroid, ImageSource, Image, Observable} from '@nativescript/core';


import { MapView, Position, Marker, Polyline, Polygon } from 'nativescript-google-maps-sdk';


import { extend, _isArray, _isObject, getConfiguration, requestPermissions } from '../utils';

import { MapModes } from './MapModes';

import { Layer } from './Layer';

import { MapActionButtons } from './MapActionButtons';

import { StreetView } from './streetView/StreetView';

import { ViewRenderer } from '../ViewRenderer';

export abstract class MapBase extends Observable {

	protected _map: MapView;
	protected _options: any;
	protected _renderer: any;
	protected _layerObjects: Array<any> = [];
	protected _mapModes: MapModes;
	protected _mapActionButons: any | MapActionButtons;

	protected _layers: Array<any> | null = null;

	constructor(map, options) {
		super();
		let me = this;
		me._map = map;

		me._options = extend({}, options);

		me._renderer = ViewRenderer.SharedInstance();

		map.on("mapReady", function(event) {


			me._map = map;

			me._mapModes = new MapModes();


			me._renderer.addActionHandler("map.setNormal", function() {
				me.setMapType("normal");
			});
			me._renderer.addActionHandler("map.setHybrid", function() {
				me.setMapType("hybrid");
			});
			me._renderer.addActionHandler("map.setSatellite", function() {
				me.setMapType("satellite");
			});
			me._renderer.addActionHandler("map.setTerrain", function() {
				me.setMapType("terrain");
			});
			me._renderer.addActionHandler("map.toggleType", function() {
				me.toggleMapType();
			});


			me._renderer.addActionHandler("map.showStreetView", function() {
				me.showStreetView();
			});



			me._renderer.addListResolver("map.layers", function() {



				return new Promise(function(resolve) {

					resolve((me._layerObjects).map((l, i) => {
						return {
							name: l.getName(),
							description: l.getDescription(),
							index: i,
							visible: l.isVisible()
						};
					}).filter((l) => {

						if (typeof l.name == "string") {

							me._renderer.addActionHandler("map.toggleLayer." + l.index, function() {
								me._layerObjects[l.index].toggleVisibility();
							});


							return true;
						}
						return false;
					}));

				});

			});


			me._renderer.addListResolver("map.types", function() {

				return new Promise(function(resolve) {

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



		map.on("markerSelect", function(event) {
			me.notify(event);
		});


		map.on("cameraChanged", function(event) {
			me.notify(event);
		});


		map.on("markerInfoWindowTapped", function(event) {
			me.notify(event);
		});
		map.on("shapeSelect", function(event) {
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

		this._renderer.getMapViewRenderer().showStreetView();

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


	public toggleMapType = function() {

		let types = ["normal", /* "satellite",*/ "hybrid", "terrain"];

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

	protected formatItem(item) {


		(() => {


			/**
			 * add layer field formatters
			 */

			if (item.urlFormatter) {

				let url = item.url;

				if (typeof item.urlFormatter == 'string') {
					let urlFormater = this._renderer._valueFormatter[item.urlFormatter];
					if (typeof urlFormater != 'function') {
						throw 'Expected tile.urlFormatter to be a function';
					}
					item.url = urlFormater(url);
					return;
				}

				if (typeof item.urlFormatter == 'function') {
					item.url = item.urlFormatter(url);
					return;
				}

				throw 'Unexpected tile.urlFormatter type. should be a function, or renderer defined function string';

			}
		})();

		return item;
	}

	public _resolveLayer(layer) {

		return new Promise((resolve, reject) => {

			if (_isObject(layer) && _isArray(layer.items)) {
				resolve(layer.items);
				return;
			}


			if (_isObject(layer) && (layer.type == "tile" || layer.type == "tileset" || layer.type == "kml" || layer.type == "traffic" || layer.type == "indoor" || layer.type == "buildings")) {


				layer = this.formatItem(layer);


				resolve([layer]);
				return;
			}


			if (typeof layer == 'string' || typeof layer == 'number' || _isObject(layer)) {
				// var args = [layer];
				this._renderer.getListViewRenderer()._listResolvers['layer'](layer).then(function(list) {
					resolve(list);
				}).catch(reject);
				return;

			}


			throw 'Unexpected layer type: ' + (typeof layer);
		});
	}

	public addLayer(item): Promise<Layer> {

		let me = this;

		return new Promise((resolve) => {

			let layer = new Layer(item, me._map);
			me._layerObjects.push(layer);
			resolve(layer);

		});

	}

	public loadLayers() {

		let me = this;
		console.log('MapBase.loadLayers');

		let mapView = me._map;

		if (!me._layers) {
			let layers = me._options.layers || getConfiguration().get('layers', () => {

				let l = getConfiguration().get('layer', false);
				if (l !== false) {
					return [l];
				}
				return [];
			});



			if (typeof layers == "string" && layers.indexOf('{') === 0) {
				layers = me._renderer._parse(layers);
			}

			me._layers = layers;
		}

		// console.log('Render Layers: '+JSON.stringify(layers));

		me._layers.forEach((l) => {

			if (typeof l == "string" && l.indexOf('{') === 0) {
				l = me._renderer._parse(l);
			}

			me._resolveLayer(l).then((list: Array<any>) => {

				console.log('MapBase.Add Layer');
				me.addLayer(extend({

				}, l)).then((layer: Layer) => {

					layer.lazyLoad(() => {

						list.forEach((item) => {


							item = this.formatItem(item);

							console.log('MapBase.Add Layer Item: ' + item.typ);

							if ((!item.type) || item.type == "marker") {
								me.addMarker(item).then((marker) => {
									layer.addItem(marker, item);
								}).catch(console.error);
							}
							if (item.type == "image") {
								me.addGroundOverlay(item).then((groundOverlay) => {
									layer.addItem(groundOverlay, item);
								}).catch(console.error);
							}
							if (item.type == "tile") {
								me.addTileLayer(item).then((tileLayer) => {
									layer.addItem(tileLayer, item);
								}).catch(console.error);
							}

							if (item.type == "tileset") {
								me.addTilesetLayer(item).then((tileLayer) => {
									layer.addItem(tileLayer, item);
								}).catch(console.error);
							}


							if (item.type == "kml" || item.type == "kml.heatmap") {

								const KmlFeature = require('./kml/KmlFeature').KmlFeature;

								KmlFeature.ReadKml(item.kml).then((kmlLayerContent) => {

									if (item.type == "kml") {
										layer.addItem(new KmlFeature(this._map, kmlLayerContent), item);
									}

									if (item.type == "kml.heatmap") {
										layer.addItem(new (require('./heatmap/HeatMapFeature').HeatMapFeature)(this._map, kmlLayerContent), item);
									}

								}).catch(console.error);
							}


							if (item.type == "json") {

								const JsonFeature = require('./json/JsonFeature').JsonFeature;
								JsonFeature.ReadJson(item.json).then((jsonLayer) => {
									layer.addItem(new JsonFeature(this, jsonLayer), item);
								}).catch(console.error);
							}

							if (item.type == "traffic") {
								layer.addItem(new (require("./TrafficFeature"))(me._map), item);
							}

							if (item.type == "indoor") {
								layer.addItem(new (require("./floorplan/FloorPlanFeature").FloorPlanFeature)(me._map), item);
							}

							if (item.type == "buildings") {
								layer.addItem(new (require("./Buildings3DFeature"))(me._map), item);
							}

						});

					});

				}).catch((e) => {
					console.error("failed to resolve items: " + JSON.stringify(items));
					console.error(e);
				});

			}).catch((e) => {
				console.error("failed to resolve layer: " + JSON.stringify(l));
				console.error(e);
			});

		});


	}

	public removeMarker = function(marker) {
		let me = this;
		me._map.removeMarker(marker);
		this.notify({
			eventName: 'removeFeature',
			object: this,
			item: marker,
			type: "marker"
		});
	};
	public addMarker = function(item) {
		let me = this;


		if (item instanceof Marker) {
			me._map.addMarker(item);
			me.notify({
				eventName: 'addFeature',
				object: this,
				item: item,
				type: "marker"
			});
			return Promise.resolve(item);
		}

		return (new Promise(function(resolve, reject) {

			let marker = new Marker();


			marker.position = Position.positionFromLatLng(item.coordinates[0], item.coordinates[1]);
			marker.title = item.name;
			// marker.snippet = item.description;

			if (item.anchor) {
				marker.anchor = item.anchor;
			}


			if (typeof item.draggable == 'boolean') {
				marker.draggable = item.draggable;
			}

			me._map.addMarker(marker);
			resolve(marker);



		})).then(function(marker: Marker) {


			return new Promise(function(resolve, reject) {


				let icon = me._renderer._parse(item.icon);
				if (_isArray(icon)) {
					icon = icon[isAndroid ? 1 : 0];
				}
				getConfiguration().getImage(icon, icon).then(function(iconPath) {

					// console.log("Render Feature: "+JSON.stringify(item, null, '   '));


					marker.userData = extend({
						icon: iconPath
					}, item);

					let image = new Image();

					image.imageSource = ImageSource.fromFileOrResourceSync(iconPath);
					marker.icon = image;
					resolve(marker);

				}).catch(function(err) {
					console.error(err);
					/**
					 * failed to parse icon
					 */
					marker.color = new Color('magenta');
					resolve(marker);

				});

			});

		}).then(function(marker: Marker) {

			me.notify({
				eventName: 'addFeature',
				object: me, // todo change to `this`
				// map:me,
				item: marker,
				type: "marker"
			});

			return marker;

		});

	};

	public selectMarker = function(item) {
		let me = this;
		me._map.notifyMarkerTapped(item);
	};

	public selectLine = function(item) {
		let me = this;
		me._map.notifyShapeTapped(item);
	};

	public setIcon = function(marker: Marker, image) {



		if (image instanceof ImageSource) {
			return new Promise((resolve, reject) => {

				let img = new Image();
				img.imageSource = image;
				marker.icon = img;
				resolve(marker);

			});
		}




		let me = this;
		return new Promise(function(resolve) {
			let icon = me._renderer._parse(image);
			if (_isArray(icon)) {
				icon = icon[isAndroid ? 1 : 0];
			}
			getConfiguration().getImage(icon, icon).then(function(iconPath) {

				// console.log("Render Feature: "+JSON.stringify(item, null, '   '));




				marker.userData.icon = image;

				let image = Image();
				image.imageSource = ImageSource.fromFile(iconPath);
				marker.icon = image;
				resolve(marker);

			}).catch(console.error);
		});


	};


	public addGroundOverlay = function(item) {

		let me = this;
		return Promise.resolve(new (require('./ground/GroundOverlayFeature').GroundOverlayFeature)(me._map, item));

	};
	public addTileLayer = function(item) {

		let me = this;

		return Promise.resolve(new (require('./tile/TileFeature').TileFeature)(me._map, item));


	};

	public addTilesetLayer = function(item) {

		let me = this;
		return Promise.resolve(new (require('./tile/TilesetFeature').TilesetFeature)(me._map, item));


	};


	public setPosition = function(marker, point) {

		let me = this;
		marker.position = Position.positionFromLatLng(point[0], point[1]);
		marker.userData.coordinates = point;


		me.notify({
			eventName: 'updateFeature',
			object: marker,
			type: "marker"
		});
	};


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
			.then(function(granted) {
				if (granted) {
					console.log("Enabling My Location..");
					mapView.myLocationEnabled = true;
					mapView.settings.myLocationButtonEnabled = true;

					return;
				}
				console.log('Location not granted');
			}).catch(console.error);


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