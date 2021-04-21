
import { getConfiguration, getRenderer, extend } from '../utils';
import { Observable } from "@nativescript/core";

import { MarkerMode } from "./add.markers/MarkerMode";
import { LineMode } from "./add.lines/LineMode";
import { TrackerMode } from "./add.tracks/TrackerMode";


import { LocalLayerData } from "./LocalLayerData";
import { MapBase as Map } from "./MapBase";


export class LocalMapFeaturesBehavior {
	constructor(config) {


		getRenderer().getMapViewRenderer().on('create', (rendererEvent) => {
			let localFeatures = new LocalMapFeatures(rendererEvent.map, config);
			rendererEvent.map.addAction('exportLocalMap', () => {
				localFeatures.getJsonData().then(list => {

					let SocialShare = require("@nativescript/social-share");
					let listText = JSON.stringify(list, null, '   ');
					SocialShare.shareText(listText);


				}).catch((e) => {
					console.error('Failed to share LocalMapFeatures');
					console.error(e);
				});
			});

		});


		getRenderer().setListResolver('usersMapFeatures', () => {
			return getConfiguration().getLocalData('usersMapFeatures', []);
		}).setListResolver("users.layer", () => {
			return Promise.resolve([{
				name: "Your local content",
				visible: true
			}]);
		});

	}
}




class LocalMapFeatures extends Observable {

	private _config: any;
	private iconPath: any;
	private _modes: any;
	private _localLayer: any;
	private _map: any;


	constructor(map, config) {
		super();

		let me = this;

		me._config = extend({
			defaultLine: {
				width: 2,
				color: "#32CD32"
			},
			defaultTrack: {
				width: 2,
				color: "#6495ED"
			},
			iconPath: '~/markers/'
		}, config);



		this.iconPath = me._config.iconPath;


		me._config = extend({
			lineTrackerOptions: {
				startIcon: this.iconPath + "circles/plain-flat/ffffff-24.png",
				endIcon: this.iconPath + "circles/plain-flat/ffffff-24.png",
				vertIcon: this.iconPath + "circles/sm/ffffff-16.png",
				selectedVertIcon: this.iconPath + "circles/sm/984ea3-16",
				selectedIcon: this.iconPath + "circles/plain-flat/984ea3-32.png",
				selectable: false,
				draggable: false
			},
			lineEditorOptions: {
				startIcon: this.iconPath + "circles/plain-flat/ffffff-24.png",
				endIcon: this.iconPath + "circles/plain-flat/ffffff-24.png",
				vertIcon: this.iconPath + "circles/sm/ffffff-16.png",
				selectedVertIcon: this.iconPath + "circles/sm/1f78b4-16.png",
				selectedIcon: this.iconPath + "circles/plain-flat/1f78b4-32.png"
			}
		}, me._config);

		if (this.iconPath !== '~/markers/') {
			map.getActionButtons().setIconPath(this.iconPath);
		}


		me._modes = map.getMapModes();


		me._localLayer = new LocalLayerData("usersMapFeatures", map, {});

		me._map = map;



		me._addMarkerMode();
		me._addLineMode();
		me._addTrackingMode();

		this._modes.setMode('marker');



		map.on('ready', (event) => {


			if (me._map !== map) {

			}
			me._map = map;
			this._modes.setMode('marker');
			// me._resumeMode();
		});



		this._localLayer.load();


		this._addMarkerTapActions();
		this._addLineTapActions();

	}



	public getJsonData() {
		return this._localLayer.getJsonData();
	}

	public _addMarkerTapActions() {

		const me = this;

		const map: Map = me._map;
		console.log('_addMarkerTapActions');
		this._localLayer.on("markerSelect", (event) => {
			const marker = event.marker;



			map.getActionButtons().addEditBtn(() => {


				this._localLayer.saveMarker(marker, () => {

				});


			});


			map.getActionButtons().addRemoveBtn(() => {


				this._localLayer.deleteMarker(marker, () => {
					map.removeMarker(marker);
				});

			});




			map.getActionButtons().show('marker');


		});


	}

	public _addLineTapActions() {

		let me = this;
		let map: Map = me._map;
		console.log('_addLineTapActions');
		this._localLayer.on("shapeSelect", (event) => {
			const shape = event.shape;


			map.getActionButtons().addEditBtn(() => {

				// me._currentLine = shape;
				// me._addLineEditor();
				// map.selectLine(me._currentLine);

			});

			map.getActionButtons().addRemoveBtn(() => {

				this._localLayer.deleteLine(shape, () => {
					map.removeLine(shape);
				});

			});



			map.getActionButtons().show('shape');


		});

	}




	public _addMarkerMode() {
		new MarkerMode(this._map, this._localLayer, {
			defaultMarker: {
				'icon': this.iconPath + "point/plain-flat/1f78b4-48.png"
			}
		});
	}





	public _updateCurrentLineIndicators() {
		let me = this;



	}

	public _addLineMode() {

		const lineEditor = new LineMode(this._map, this._localLayer, {
			defaultLine: this._config.defaultLine,
			lineEditorOptions: this._config.lineEditorOptions
		});
		lineEditor.on("addLineEditor", (event) => {
			// this._currentLineEdit = event.object;
		});

	}


	public _addTrackingMode() {
		const tracker = new TrackerMode(this._map, this._localLayer, {
			defaultTrack: this._config.defaultTrack,
			lineTrackerOptions: this._config.lineTrackerOptions,
			lineEditorOptions: this._config.lineEditorOptions
		});

		tracker.on("addLineTracker", (event) => {

		});

		tracker.on("addLineEditor", (event) => {
			// this._currentLineEdit = event.object;
		});
	}


}




