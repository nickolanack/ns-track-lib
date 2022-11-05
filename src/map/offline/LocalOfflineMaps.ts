
import { extend, getRenderer, setCurrentPageData } from '../../utils';

import { MapView, Polygon } from 'nativescript-google-maps-sdk';

import { MapBase as Map } from '../MapBase';

import { MapModes } from '../MapModes';

import { LocalLayerData } from "../LocalLayerData";

import { LineDecorator } from '../LineDecorator';

import { Observable, File, knownFolders, path} from "@nativescript/core";

import {LineStyler} from "../style/LineStyler";

import * as MapViewRenderer from "ns-track-lib/src/MapViewRenderer";


interface Workerish {
	postMessage: (msg: any) => void;
	on: (event: string, callback: (event: any) => void) => void;
}

export class LocalOfflineMapBehavior extends Observable implements Workerish {

	private _worker: Worker;

	constructor(config) {

		super();

		MapViewRenderer.SharedInstance().on('create', (rendererEvent) => {
			const offlineMap = new LocalOfflineMap(rendererEvent.map, config);
			if (this._worker) {
				offlineMap.setWorker(this);
			}
		});

	}


	public setWorker(worker: Worker) {
		this._worker = worker;
		this._worker.onerror = (err) => {
			console.error("Local Offline Maps: Worker Error");
			console.error(err);
		};
		this._worker.onmessage = (msg) => {
			this.notify(extend({ object: this }, msg.data));
		};
	}

	public postMessage(msg) {
		this._worker.postMessage(msg);
	}

}


class LocalOfflineMap {

	private _map: Map;
	private _config: any;
	private _poly: Polygon;
	private _mapModes: MapModes;
	private iconPath: string;
	private _currentLineEdit: any | LineDecorator;
	private _localLayer: LocalLayerData;

	private _worker: Workerish;

	constructor(map, config) {


		this._config = extend({
			defaultOutline: {
				lineWidth: 2,
				lineColor: "yellow",
				fillColor: "rgba(0,0,0,0.2)"
			},
			iconPath: "~/markers/",
		}, config);

		this.iconPath = this._config.iconPath;

		this._config = extend({

			lineEditorOptions: {
				startIcon: this.iconPath + "circles/plain-flat/ffffff-24.png",
				endIcon: this.iconPath + "circles/plain-flat/ffffff-24.png",
				vertIcon: this.iconPath + "circles/plain-flat/ffffff-24.png",
				selectedVertIcon: this.iconPath + "circles/plain-flat/ffffff-24.png",
				selectedIcon: this.iconPath + "circles/plain-flat/ffffff-24.png"
			}
		}, this._config);

		this._map = map;

		this._addMapMode();

		map.on("mapReady", (event) => {
			try {
				this._init();
			} catch (e) {
				console.error(e);
			}

		});
		this._init();


		this._localLayer = new LocalLayerData("usersOfflineMapFeatures", {});
		this._localLayer.on("addPolygon", (event) => {

			this._map.setMapTypeNone();
			const polygonData = (<Polygon>event.object).userData;

			console.log('Offline Tile');
			const filePath = path.join(knownFolders.temp().path, 'gmap_hybrid_tileset_' + polygonData._id, '{z}', '{x}', "{y}.jpeg");
			console.log("Load Offline Tile: " + filePath);
			this._map.addTileLayer({
				file: filePath,
				bounds: polygonData.coordinates
			}).then((tileLayer) => {
				tileLayer.setZIndex(-1);
				tileLayer.show();
			});


		});
		this._localLayer.renderOnMap(map);


		map.on("shapeSelect", (event) => {
			const shape = event.shape;

			if(!this._localLayer.hasShape(shape)){
				return;
			}


			console.log("Map Zoom: " + this._map.getZoom());

			this._map.getActionButtons().addRemoveBtn(() => {



				this._localLayer.deleteLine(shape, () => {
					this._map.removeLine(shape);
				});

			});



			this._map.getActionButtons().show('shape');


		});




	}


	public setWorker(worker: Workerish) {

		this._worker = worker;
		this.postMessage({
			"eventName": "initOfflineMap",
			"dataName": this._localLayer.getDataName()
		});

		this._localLayer.on("removePolygon", (event) => {
			this.postMessage({
				"eventName": "addOfflineBounds"
			});
		});

		this._localLayer.on("savePolygon", (event) => {
			this.postMessage({
				"eventName": "removeOfflineBounds"
			});
		});


		worker.on('tileDownloadComplete', (event) => {

			console.log(event);

		});

	}


	private postMessage(msg) {
		if (!this._worker) {
			console.error("No Worker");
			return;
		}
		this._worker.postMessage(msg);
	}

	private _addMapMode() {

		this._mapModes = this._map.getMapModes();
		this._mapModes.addMode('offline', () => {


			setCurrentPageData('isSavingOffline', true);

			if (this._poly) {
				this._map.removePolygon(this._poly);
				this._poly = null;
			}

			this._map.addPolygon(extend({
				title: "Offline bounds",
				coordinates: this._map.getBoundsPoly(),
			}, this._config.defaultOutline)).then((poly: Polygon) => {

				(new LineStyler(poly, this._map)).setPattern(['dash', 'gap', 'dot', 'gap']);

				this._poly = poly;
				this._map.setZoom(this._map.getZoom() - 1).catch(console.error);

				this._currentLineEdit = new LineDecorator(this._map, poly, extend({}, this._config.lineEditorOptions));

			}).catch(console.error);


			this._map.getActionButtons().addSaveBtn(() => {

				const poly = this._poly;

				this.storeOffline(poly);

				this._poly = null;

				this._mapModes.clearMode('offline');


			});

			this._map.getActionButtons().addRemoveBtn(() => {
				this._mapModes.clearMode('offline');


			});

			this._map.getActionButtons().show('offline');

			console.log('saveOffline');

		}, () => {

			setCurrentPageData('isSavingOffline', false);

			if (this._currentLineEdit) {
				this._currentLineEdit.remove();
			}

			if (this._poly) {
				this._map.removePolygon(this._poly);
				this._poly = null;

			}

		});
	}


	private _init() {

		getRenderer()
			.setActionHandler("map.saveOffline", () => {

				if (this._mapModes.isMode('offline')) {
					this._mapModes.clearMode('offline');
				} else {
					this._mapModes.setMode('offline');
				}

			})
			.setListResolver("offline.layers", () => {
				return Promise.resolve([]);
			});
	}


	private storeOffline(poly: Polygon) {
		
		this._localLayer.savePolygon(poly).then().catch((e)=>{
					
			console.error('LocalOfflineMaps Failed to save marker');
			console.error(e);

		});
	}


}
