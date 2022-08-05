

import { MapBase as Map } from './MapBase';
import { TourBehavior, ActionTemplateHandler} from './TourBehavior';
import { MapView, Position, Marker, Polyline, Polygon } from 'nativescript-google-maps-sdk';
import { extend } from 'tns-mobile-data-collector/src/utils';
import {LineDecorator} from './LineDecorator';
import {isIOS} from "@nativescript/core";

export class MapTourBehavior extends TourBehavior {

	private _map: Map;
	private _lines: Array<any> = [];
	private _lineSections: Array<any> = [];
	private _lineDecorator: LineDecorator|null = null;
	private _focusedItem: Marker|null=null;

	public constructor(map: Map, options?: any) {
		super(<ActionTemplateHandler>map, extend({
			tourZoom: 17
		}, options));
		this._map = map;
	}
	protected startTour() {


		console.log('Map Tour: starting');

		if (!this.hasDirections()) {


			this._map.addLine({
				coordinates: this._points,
				width: isIOS?3:6,
				color: "cornflowerblue"
			}).then((l) => {

				console.log('add main line');
				this._lines.push(l);
			});

		}


		this._points.forEach((p, index) => {
			if (index == 0) {
				return;
			}
			let directions = this.getDirectionsTo(index);
			if (directions) {

				this._map.addLine({
					coordinates: directions,
					width: isIOS?4:8,
					color: "white"
				}).then((l) => {

					console.log('add segments');
					this._lines.push(l);
				});

			}
			console.log(directions);
		});

		console.log('Map Tour: added segments - running');


	}


	protected focusTourStep(index) {
		this._map.setZoomAndCenter(this._options.tourZoom, this._points[index]);
		this._lineSections.forEach((l) => {
			this._map.removeLine(l);
		});
		if (this._lineDecorator) {
			this._lineDecorator.remove();
			this._lineDecorator = null;
		}
		let directions = this.getDirectionsTo(index);
		if (directions) {

			this._map.addLine({
				coordinates: directions,
				width: isIOS?4:8,
				color: "#5daeeb"
			}).then((l) => {

				this._lineSections.push(l);
				this._lineDecorator = new LineDecorator(this._map, l, {
					startIcon: "~/markers/circles/sm/1f78b4-16.png",
					endIcon: "~/markers/circles/plain-flat/b2df8a-24.png",
					vertIcon: "~/markers/circles/sm/1f78b4-16.png",
					selectedVertIcon: false,
					selectedIcon: "~/markers/circles/plain-flat/1f78b4-32.png",
					clickable: false,
					draggable: false,
					autoselect: false
				});
			});

		}


		this.getItemMarker(this.getTourItem(index), (marker)=>{

			if(this._focusedItem){
				this.notify({
					eventName: "unFocusItem",
	  				object: this,
	  				item:this._focusedItem,
	  				map:this._map
	  			});
			}

			this._focusedItem=marker;

			this.notify({
				eventName: "focusItem",
  				object: this,
  				item:marker,
	  			map:this._map
  			});

		});



	}

	protected endTour() {
		this._lines.forEach((l) => {
			this._map.removeLine(l);
		});
		this._map.resetMapView();

		if(this._focusedItem){
			this.notify({
				eventName: "unFocusItem",
  				object: this,
  				item:this._focusedItem,
	  			map:this._map
  			});
  			this._focusedItem=null;
		}

	}


	protected getItemMarker(tourItem, callback) {
		this._map.getLayers().forEach((l) => {

			let item: Marker | null = l.getItemByFilter((item) => {
				return item.userData.id == tourItem.id;
			});

			if (item) {
				callback(item);
			}
		});
	}


	protected getVisibleItemLocationData(tourItem, callback) {

		this.getItemMarker(tourItem, (item)=>{
			callback([item.position.latitude, item.position.longitude]);
		});

	}


	protected getItemLabel(tourItem, callback) {

		this.getItemMarker(tourItem, (item)=>{
			callback(item.userData.name);
		});

	}


}