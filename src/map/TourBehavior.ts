"use strict";


import { Observable, ItemEventData } from "@nativescript/core";

import {PickerField} from "nativescript-picker";

import { extend, getRenderer } from '../utils';


export interface ActionTemplateHandler {
	addAction: (name: string, func: () => void) => void;
	getActionName: (suffix: string) => string;
}

export abstract class TourBehavior extends Observable {


	protected _viewer: ActionTemplateHandler;
	protected _options: any;

	protected _tours: Array<any> = [];
	protected _points: Array<any> = [];

	protected _currentTour: number = -1;
	protected _currentIndex: number = -1;
	protected _currentTourData: any = null;

	constructor(viewer: ActionTemplateHandler, options) {
		super();

		this._viewer = viewer;
		this._options = extend({
			// generic options;
		}, options);



		this._viewer.addAction('tour.startTour', () => {

			if (this.isInTour()) {
				this.toggleTour();
				return;
			}

			this.pickTour().then((i) => {
				this.toggleTour(this._tours[i]);
			});


		});
	}


	protected abstract startTour();
	protected abstract focusTourStep(index);
	protected focusTourItem(tourItem) {
		// optional override
	}
	protected abstract endTour();
	protected abstract getVisibleItemLocationData(tourItem, callback);
	protected abstract getItemLabel(tourItem, callback);

	public setTourStep(index) {

		// animate or display tour step
		this.focusTourStep(index);
		let order = this._currentTourData.order;
		this.getItemLabel(order[index], function(label) {
			getRenderer().setCurrentViewData({
				"currentTourItemLabel": label
			});
		});


		getRenderer().setCurrentViewData({"currentTourStep": index + 1});

		this.focusTourItem(order[index]);



	}

	protected hasDirections() {
		if (!this._currentTourData) {
			return false;
		}
		let directions = this._currentTourData.directions;
		return (directions && directions.length && directions.filter((d) => {
			return d.status == "OK"; // at least one valid directions step
		}).length > 0 );
	}
	protected getDirectionsTo(index: number) {

		let directions = this._currentTourData.directions;
		if (!(directions && directions[index] && directions[index].status == "OK")) {
			return null;
		}

		directions = directions[index].routes[0];
		return this.polylineDecode(directions.overview_polyline.points);


	}


	private polylineDecode(str: string) {

		let precision = 5;
		let index = 0,
			lat = 0,
			lng = 0,
			coordinates = [],
			shift = 0,
			result = 0,
			byte = null,
			latitude_change,
			longitude_change,
			factor = Math.pow(10, Number.isInteger(precision) ? precision : 5);

		// Coordinates have variable length when encoded, so just keep
		// track of whether we've hit the end of the string. In each
		// loop iteration, a single coordinate is decoded.
		while (index < str.length) {

			// Reset shift, result, and byte
			byte = null;
			shift = 0;
			result = 0;

			do {
				byte = str.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);

			latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

			shift = result = 0;

			do {
				byte = str.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);

			longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

			lat += latitude_change;
			lng += longitude_change;

			coordinates.push([lat / factor, lng / factor]);
		}

		return coordinates;

	}


	public pickTour() {


		return new Promise<number>((resolve, reject) => {

			if (this._tours.length == 1) {
				resolve(0);
				return;
			}


			try {

				let items = this._tours.map((t) => {
					return t.name;
				});
				let field = (new PickerField({
					items: items,
					modalAnimated: true,
					androidCloseButtonIcon: "~/menu-icons/close.png"
				}));

				field.modalAnimated = true;
				field.items = items;
				field.androidCloseButtonIcon = "~/menu-icons/close.png";
				field.pickerTitle = "Choose a Tour";

				field.on("pickerClosed", () => {
					let value = field.text;
					if (value && value != "") {

						this._tours.forEach((t, i) => {
							if (t.name == value) {
								resolve(i);
							}
						});

					} else {
						reject('No selection');
					}
					container.removeChild(field);
				});

				field.on("itemLoading", (args: ItemEventData) => {


					try {
						args.view = getRenderer().renderField(null, {
							"type": "fieldset",
							"className": "inline",
							"orientation": "horizontal",
							"fields": [{
								"type": "icon",
								"orientation": "vertical",
								"icon": "~/menu-icons/goto.png",

							}, {

								"type": "label",
								"value": items[args.index]
							}]
						});
					} catch (e) {
						console.log(e);
					}
				});

				// let template =new PickerField.itemTemplate();
				// fiels.addChild(template);

				 let container = getRenderer().getViewById('container');
				 container.addChild(field);


				field.tapHandler();
			} catch (e) {
				console.error(e);
			}



		});


	}

	public isInTour() {

		return this._currentIndex >= 0;
	}

	public addTour(tour) {

		let newTour = JSON.parse(JSON.stringify(tour));
		newTour.id = this._tours.length;
		this._tours.push(newTour);

		this.notify({
			eventName: "addTour",
			object: this,
			tour: JSON.parse(JSON.stringify(newTour))
		});


		this._viewer.addAction('tour.startTour.' + newTour.id, () => {

			this.toggleTour(newTour);

		});

		this._viewer.addAction('tour.previous', () => {


			if (this._currentIndex <= 0) {
				return;
			}

			this._currentIndex--;
			this.setTourStep(this._currentIndex);


			getRenderer().setCurrentViewData({
				"tourHasNext": this._currentIndex < this._points.length - 1,
				"tourHasPrevious": this._currentIndex > 0
			});

		});

		this._viewer.addAction('tour.next', () => {

			if (this._currentIndex >= this._points.length - 1) {
				return;
			}

			this._currentIndex++;
			this.setTourStep(this._currentIndex);
			getRenderer().setCurrentViewData({
				"tourHasNext": this._currentIndex < this._points.length - 1,
				"tourHasPrevious": this._currentIndex > 0
			});

		});

	}




	private toggleTour(tour?: any) {



		if (this.isInTour()) {

			this._currentTour = -1;
			this._currentIndex = -1;
			this._currentTourData = null;

			getRenderer().setCurrentViewData({
				"inTour": false,
				"currentTour": "None",
				"tourHasNext": false,
				"tourHasPrevious": false
			});
			this.endTour();
			return;
		}

		getRenderer().setCurrentViewData({
			"inTour": true,
			"currentTour": tour.name,
			"tourHasNext": false,
			"tourHasPrevious": false,
			"currentTourStepsCount": tour.order.length
		});





		let points = [];
		tour.order.forEach((tourItem) => {


			this.getVisibleItemLocationData(tourItem, (location) => {
				points.push(location);
			});

		});

		this._points = points;
		this._currentIndex = 0;
		this._currentTour = tour.id;
		this._currentTourData = tour;
		this.startTour();


		if (points.length > 1) {
			getRenderer().setCurrentViewData({ tourHasNext: true });
		}
		this.setTourStep(0);
		getRenderer().setCurrentViewData({
			"tourHasNext": this._currentIndex < this._points.length - 1,
			"tourHasPrevious": this._currentIndex > 0
		});


	}


	public displayDefualtNavigation(options?) {


		let config = extend({
			className: "overlay", // "theme-legend inline"
			position: {
				"bottom": 70,
				"left": 10,
			}
		}, options);

		this.once("addTour", (event: any) => {


			getRenderer().setCurrentViewData({
				"inTour": false,
				"currentTour": "None",
				"tourHasNext": false,
				"tourHasPrevious": false
			});

			getRenderer().renderField(null, extend({
				"type": "fieldset",
				"position": "absolute",
				"className": config.className + " tour-controls",
				"orientation": "vertical",
				"fields": [


					{

						"type": "heading",
						"className": "{data.inTour|?``:`hidden`} tour-heading",
						"value": "{data.currentTour}"
					},
					{

						"type": "label",
						"className": "{data.inTour|?``:`hidden`} tour-item-label",
						"value": "Step {data.currentTourStep} of {data.currentTourStepsCount}: {data.currentTourItemLabel}"
					},

					{
						"type": "fieldset",
						// "className":config.className,
						"orientation": "horizontal",
						"fields": [
						{

							"type": "fieldset",
							// "className":config.className,
							"fields": [{
								"className": "map-control {data.inTour|?`remove`:`save start-tour`}",
								"type": "icon",
								"orientation": "vertical",
								"icon": "{data.inTour|?`~/menu-icons/close.png`:`~/menu-icons/goto.png`}",
								"action": this._viewer.getActionName('tour.startTour')

							}, {

								"type": "label",
								"value": "{data.inTour|?`Stop Tour`:`Start Tour`}"
							}]
						},
						{
							"type": "fieldset",
							"className": "{data.inTour|?``:`hidden`}",
							"fields": [{
								"className": "map-control {data.tourHasPrevious|?`enabled`:`disabled`}",
								"type": "icon",
								"orientation": "vertical",
								"icon": "~/menu-icons/previous.png",
								"action": this._viewer.getActionName('tour.previous')

							}, {

								"type": "label",
								"value": "Previous"
							}]
						},
						{
							"type": "fieldset",
							"className": "{data.inTour|?``:`hidden`}",
							"fields": [{
								"className": "map-control {data.tourHasNext|?`enabled`:`disabled`}",
								"type": "icon",
								"orientation": "vertical",
								"icon": "~/menu-icons/next.png",
								"action": this._viewer.getActionName('tour.next')

							}, {

								"type": "label",
								"value": "Next"
							}]
						}]
					}



				]
			}, config.position));

		});
	}




}