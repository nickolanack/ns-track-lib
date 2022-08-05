"use strict";


var MapView=require("nativescript-google-maps-sdk").MapView;
var isIOS=require("@nativescript/core").isIOS;

//declare var GMSServices: any;

let SharedInstance=null;


function MapViewRenderer() {

	if(SharedInstance){

		throw 'Already instantiated. use MapViewRenderer.SharedInstance()'
	}

	SharedInstance=this;

	 if (isIOS) {
        /**
         * Not required for android. ios requires app key from developer console...
         * A blank map background indicates an invalid key. 
         */
        	
        let api=require('~/apikey.json');

       	console.log('Set Google Map API key from json:'+api.key);
        GMSServices.provideAPIKey(api.key);
    }

	


	var me = this;
	me._type = "normal";

	/**
	 * Render simple items, fields, buttons etc.
	 */
	me._renderer = require('tns-mobile-data-collector').ViewRenderer.SharedInstance();

	me._renderer.addViewType('map', function(container, field) {
		return me.renderMap(container, field);
	});

	me._renderer.addViewType('streetView', function(container, field) {
		return me.renderStreetView(container, field);
	});
}


try {

	var Observable = require("@nativescript/core").Observable;
	MapViewRenderer.prototype = new Observable();
} catch (e) {
	console.error('Unable to extend Observable!!!');
}

MapViewRenderer.SharedInstance = function() {
	if(!SharedInstance){
		return new MapViewRenderer();
	}
	return SharedInstance;
}


MapViewRenderer.prototype._setMapState = function(state) {
	var me = this;
	state = JSON.parse(JSON.stringify(state));

	var model=me._renderer.getModel();

	if(!model){
		console.error('model is gone - transition?');
		return;
	}

	Object.keys(state).forEach(function(k) {
		model.set(k, state[k]);
	})

}


MapViewRenderer.prototype.showStreetView = function() {


	var StreetView = require("./map/streetView/StreetView").StreetView;
	
	
	var streetView = new StreetView();
	

	this._currentContainer.addChild(streetView);
	this._renderer._addClass(this._currentMapview, "with-streetview");
	

}


MapViewRenderer.prototype.renderStreetView = function(container, field) {


	var StreetView = require("./map/streetView/StreetView").StreetView;
	this._renderer._addClass(this._renderer._page, "with-map");
	
	var streetView = new StreetView(field);	

	container.addChild(streetView);


	this.notify(extend({},{
		eventName: 'showStreetView',
		object: this, 
		streetView: streetView
	}));


	streetView.on("markerSelect", (event) => {

		if(event['marker']&&event.marker["userData"]){
			this._setMapState({
				"feature": {
					"type": "marker",
					"id": event.marker.userData.id || event.marker.userData._id || -1,
					"title": event.marker.title || event.marker.userData.title || "",
					"description": event.marker.userData.description || "",
					"creationDate": event.marker.userData.creationDate || "",
					"uid": event.marker.userData.uid || "",
					"icon": event.marker.userData.icon || "default",
					"userData": event.marker.userData || {},
					"attributes": event.marker.userData.attributes || {},
				}
			});


			this._setMapState({
				"hasActiveFeature": true,
			});

			console.log("markerSelect: " + Object.keys(event));

			if (field.markerDetail) {
				this._renderer._showSubform(_isObject(field.markerDetail)?field.markerDetail:{
					"view": field.markerDetail
				});
			}

			this.notify(event);
		}

	});


	return streetView;	

}





MapViewRenderer.prototype.renderMap = function(container, field) {

	var me = this;
	this._currentContainer=container;
	me._layers = null;

	me._renderer._addClass(me._renderer._page, "with-map");

	field = extend({
		center: [0, 0],
		zoom: 0
	}, field);

	var mapView = new MapView();
	var Map = require("./map/Map").Map;
	var map = new Map(mapView, field);
	me._map = map;

	container.addChild(mapView);
	this._currentMapview=mapView;


	me._mapActionButons = new(require('./map/MapActionButtons').MapActionButtons)(container);
	map.setActionButtons(me._mapActionButons);



	var state = {
		"hasActiveFeature": false,
		"feature": false,
		"center": [field.center[0], field.center[1], field.zoom]
	};

	me._setMapState(state);
	var fieldName = field.name || "map";


	map.once("mapReady", function(event) {

		try{
			me._map = map;

			//{ eventName: MapViewBase.mapReadyEvent, object: this, gMap: this.gMap }
			me.notify(extend({},event,{
				eventName: 'create',
				object: me, 
				map: map, 
				mapView:mapView
			}));

		}catch(e){
			console.error(e);
		}

	});

	map.on("mapReady", function(event) {


		try{
			me._map = map;
			//{ eventName: MapViewBase.mapReadyEvent, object: this, gMap: this.gMap }
			me.notify(extend({},event,{
				eventName: 'ready',
				object: me,
				map: map,
				mapView:mapView
			}));

		}catch(e){
			consol.error(e);
		}

	});

	map.on("addFeature", function(event){

		me.notify(extend({},event,{object:me, map:event.object}));
	})





	map.on("markerSelect", function(event) {

		if(event['marker']&&event.marker["userData"]){
			me._setMapState({
				"feature": {
					"type": "marker",
					"id": event.marker.userData.id || event.marker.userData._id || -1,
					"title": event.marker.title || event.marker.userData.title || "",
					"description": event.marker.userData.description || "",
					"creationDate": event.marker.userData.creationDate || "",
					"uid": event.marker.userData.uid || "",
					"icon": event.marker.userData.icon || "default",
					"userData": event.marker.userData || {},
					"attributes": event.marker.userData.attributes || {},
				}
			});


			me._setMapState({
				"hasActiveFeature": true,
			});

			console.log("markerSelect: " + Object.keys(event));

			if (field.markerDetail) {
				me._renderer._showSubform(_isObject(field.markerDetail)?field.markerDetail:{
					"view": field.markerDetail
				});
			}

			me.notify(event);
		}

	});

	map.on("cameraChanged", function(event) {
		console.log("cameraChanged: " + Object.keys(event) + Object.keys(event.camera));
		me._setMapState({
			"center": [
				event.camera.latitude, event.camera.longitude, event.camera.zoom
			]
		});
		me.notify(event);
	});

	map.on("markerInfoWindowTapped", function(event) {
		console.log("markerInfoWindowTapped: " + Object.keys(event));
		me.notify(event);
	});
	map.on("shapeSelect", function(event) {
		console.log("shapeSelect: " + Object.keys(event));
		me.notify(event);
	});
	map.on("markerBeginDragging", function(event) {
		console.log("markerBeginDragging: " + Object.keys(event));
		me.notify(event);
	});
	map.on("markerEndDragging", function(event) {
		console.log("markerEndDragging: " + Object.keys(event));
		me.notify(event);
	});
	map.on("markerDrag", function(event) {
		console.log("markerDrag: " + Object.keys(event));
		me.notify(event);
	});


	map.on("coordinateTapped", function(event) {
		console.log("coordinateTapped: " + Object.keys(event) + ' ' + (event.position));

		me._setMapState({
			"hasActiveFeature": false,
			"feature": false
		});
		me.notify(event);
	});
	map.on("coordinateLongPress", function(event) {
		me.notify(event);
	});
	map.on("myLocationTapped", function(event) {
		me.notify(event);
	});


	return mapView;

}


module.exports = MapViewRenderer;


var extend = function() {


	var a = arguments[0] || {};
	var items = Array.prototype.slice.call(arguments, 1);

	items.forEach(function(b) {
		b = b || {};
		Object.keys(b).forEach(function(k) {
			a[k] = b[k];
		});
	})


	return a;
}


var _isObject = (a) => {
	return Object.prototype.toString.call(a) == "[object Object]"
}