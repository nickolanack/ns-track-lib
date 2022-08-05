
import { extend } from 'tns-mobile-data-collector/src/utils';
import { Observable } from "@nativescript/core";
import { MapBase as Map } from './MapBase';
import { Polyline, Polygon, Marker } from 'nativescript-google-maps-sdk';

export class LineDecorator extends Observable {

	private _config: any;
	private _map: Map;
	private _currentLine: Polyline|Polygon;
	private _currentLinePoints: Array<any> = [];
	private _currentLineStart: any | Marker;
	private _currentLineEnd: any | Marker;
	private _selected: any | Marker;
	private _next: any | Marker;

	constructor(map, line, options) {
		super();

		this._config = extend({

			startIcon: ["~/markers/circles/plain-flat/ffffff-24.png","~/markers/circles/plain-flat/ffffff-48.png"],
			endIcon: ["~/markers/circles/plain-flat/ffffff-24.png","~/markers/circles/plain-flat/ffffff-48.png"],
			vertIcon: ["~/markers/circles/sm/ffffff-16.png","~/markers/circles/sm/ffffff-32.png"],
			selectedVertIcon: false,
			selectedIcon: ["~/markers/circles/plain-flat/1f78b4-32.png","~/markers/circles/plain-flat/1f78b4-48.png"],
			clickable: true,
			draggable: true,
			autoselect: true
		}, options);

		this._map = map;
		this._currentLine = line;


		if (this._config.draggable) {
			const _dragFn = (event) => {

				let marker = event.marker;
				if (this.isVertex(marker)) {
					map.updateLinePointAt(this._currentLine, this._currentLinePoints.indexOf(marker), [marker.position.latitude, marker.position.longitude]);
				}

			};

			map.on("markerDrag", _dragFn);

			this.once("remove", () => {

				this._map.off("markerDrag", _dragFn);

			});
		}




		if (this._config.clickable) {
			const _selectFn = (event) => {

				let marker = event.marker;
				this.select(marker);

			};


			map.on("markerSelect", _selectFn);


			this.once("remove", () => {
				this._map.off("markerSelect", _selectFn);
			});

		}

		this.update().then(() => {
			if (this._config.autoselect) {
				this.select(this._currentLinePoints[this._currentLinePoints.length - 1]);
			}
		});

	}


	public select(marker) {

		this.clearSelected();
		if (this.isVertex(marker)) {


			let icon = this._config.selectedVertIcon || this._config.selectedIcon;
			if (marker === this._currentLineStart || marker === this._currentLineEnd) {
				icon = this._config.selectedIcon || icon;
			}


			this._map.setIcon(marker, icon);
			this._selected = marker;
			this.notify({
				"eventName": 'markerSelect',
				marker: marker,
				object: this
			});
		}
	}

	public isVertexSelected(index) {

		if (this._selected && this._currentLinePoints.length > index && this._selected === this._currentLinePoints[index]) {
			return true;
		}
		return false;
	}
	public reverse() {

		if (this._currentLine.getPoints().length < 2) {
			return;
		}

		this._map.reverseLinePoints(this._currentLine);

		let tmp = this._currentLineStart;
		this._currentLineStart = this._currentLineEnd;
		this._currentLineEnd = tmp;

		this._currentLinePoints.reverse();

	}


	public addPoint(coordinate) {


		if (this.isVertexSelected(0)) {
			this.reverse();
		} else {

		}

		this._map.addPointToLine(this._currentLine, coordinate);
		this.update().then(() => {
			if (this._config.autoselect) {
				this.select(this._currentLinePoints[this._currentLinePoints.length - 1]);
			}
		});

	}

	public clearSelected() {

		if (!this._selected) {
			return;
		}

		let marker = this._selected;

		if (marker === this._currentLineStart) {
			this._map.setIcon(marker, this._config.startIcon);
			return;
		}
		if (marker === this._currentLineEnd) {

			this._map.setIcon(marker, this._config.endIcon);
			return;
		}

		this._map.setIcon(marker, this._config.vertIcon);

		delete this._selected;
	}
	public getLine() {
		return this._currentLine;
	}

	public isVertex(item) {
		return this._currentLinePoints.indexOf(item) >= 0;
	}


	public splice(point) {
		if (!this.isVertex(point)) {
			return;
		}

		let i = this._currentLinePoints.indexOf(point);
		this._map.removeLinePointAt(this._currentLine, i);



		let marker = this._currentLinePoints.splice(i, 1).pop();
		this._map.removeMarker(marker);

		if (marker === this._currentLineEnd) {
			delete this._currentLineEnd;
		}
		if (marker === this._currentLineStart) {
			delete this._currentLineStart;
		}

		return this.update().then(() => {

			if (marker === this._selected && this._currentLinePoints.length > 0) {
				if (this._currentLinePoints.length > i) {
					this._next = this._currentLinePoints[i];
				} else {
					this._next = this._currentLinePoints[this._currentLinePoints.length - 1];
				}
			} else {
				delete this._next;
			}

			if (this._config.autoselect) {
				this.selectNext();
			}

		});



	}

	public selectNext() {
		/**
		 * called automatically after splicing selected node
		 * if items are touch enabled then trigger a click event - as if user interacted, otherwise just select (hightlight)
		 * this is useful for editing lines where menu is drawn on on real touch events
		 */
		if (this._next && this._currentLinePoints.indexOf(this._next) >= 0) {
			if (this._config.clickable) {
				this._map.selectMarker(this._next);
			} else {
				this.select(this._next);
			}
			return;
		}
		if (this._config.clickable) {
			this._map.selectLine(this._currentLine);
		}

	}

	public update() {


		let points = this._currentLine.getPoints();
		let map = this._map;

		if (points.length > 0 && !this._currentLineStart) {


			if (this._currentLinePoints.length > 0) {
				let first = this._currentLinePoints.shift();
				this._map.removeMarker(first);
				if (first === this._currentLineEnd) {
					delete this._currentLineEnd;
				}
			}

			return map.addMarker({
				'title': "Track Start",
				'icon': this._config.startIcon,
				'coordinates': [points[0].latitude, points[0].longitude],
				'draggable': this._config.draggable,
				'anchor': [.5, .5]
			}).then((marker) => {
				this._currentLineStart = marker;
				this._currentLinePoints = ([marker]).concat(this._currentLinePoints);
				return this.update();
			}).catch(console.error);

		}

		if (points.length > 1 && !this._currentLineEnd) {

			if (this._currentLinePoints.length >= points.length) {
				this._currentLinePoints.splice(points.length - 1).forEach((last) => {
					this._map.removeMarker(last);
				});
			}

			return map.addMarker({
				'title': "Track End",
				'draggable': this._config.draggable,
				'icon': this._config.endIcon,
				'coordinates': [points[points.length - 1].latitude, points[points.length - 1].longitude],
				'anchor': [.5, .5]
			}).then((marker) => {
				this._currentLineEnd = marker;
				this._currentLinePoints.push(marker);
				return this.update();
			}).catch(console.error);

		}


		if (points.length > this._currentLinePoints.length) {

			return map.addMarker({
				'title': "Track Point",
				'icon': this._config.vertIcon,
				'draggable': this._config.draggable,
				'coordinates': [points[this._currentLinePoints.length - 1].latitude, points[this._currentLinePoints.length - 1].longitude],
				'anchor': [.5, .5]
			}).then((point) => {
				this._currentLinePoints = this._currentLinePoints.slice(0, -1);
				this._currentLinePoints.push(point);
				this._currentLinePoints.push(this._currentLineEnd); // keep end marker at the end
				return this.update();
			}).catch(console.error);

		}

		return new Promise((resolve) => {



			points.forEach((p, i) => {
				map.setPosition(this._currentLinePoints[i], [p.latitude, p.longitude]);
			});

			resolve(true);

		});


	}
	public remove() {


		this.notify({
			eventName: "remove",
			object: this
		});

		this._currentLinePoints.forEach((p) => {
			this._map.removeMarker(p);
		});

		this._currentLinePoints = [];

		delete this._currentLine;
		delete this._currentLineEnd;
		delete this._currentLineStart;


	}

}

