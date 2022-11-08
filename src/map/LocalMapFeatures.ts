
import { getConfiguration, getRenderer, extend } from 'tns-mobile-data-collector/src/utils';
import { Observable, EventData } from "@nativescript/core";

import { MarkerMode } from "./add.markers/MarkerMode";
import { LineMode } from "./add.lines/LineMode";
import { TrackerMode } from "./add.tracks/TrackerMode";
import { CameraMarkerMode } from "./add.cameraMarker/CameraMarkerMode";



import { LocalLayerData } from "./LocalLayerData";
import { MapBase as Map, MarkerEventData, ShapeEventData } from "./MapBase";

import * as MapViewRenderer from "ns-track-lib/src/MapViewRenderer";




export interface MapFeaturesEventData extends EventData {
	localFeaturesLayer:any,
	layer:any
}


export class LocalMapFeaturesBehavior extends Observable{

	private _config:any;

	constructor(config) {

		super();


		this._config = extend({
			userDataName: 'usersMapFeatures' //default this is automatically prefixed by domain 
		}, config);


		MapViewRenderer.SharedInstance().on('create', (rendererEvent) => {
			

			let localFeatures = new LocalMapFeatures(rendererEvent.map, extend({}, this._config));

			this.notify({
				eventName:"addLocalMapFeaturesLayer",
				object:this,
				localFeaturesLayer:localFeatures,
				layer:localFeatures.getLayer()
			})

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
		
			return getConfiguration().getLocalData(this.getDataName(), []);
		
		}).setListResolver("users.layer", () => {
			return Promise.resolve([{
				name: "Your local content",
				visible: true
			}]);
		});

	}

	public getDataName(){
		let name=this._config.userDataName;
		if(typeof name=='function'){
			name=name();
		}
		return name;
	}


	public setOptions(config){

		this._config=extend({}, this._config, config);
		return this;

	}


	public getLocalLayerData(){
		return new LocalLayerData(this.getDataName(), {});
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
			iconPath: '~/markers/',
			dataName: 'usersMapFeatures'
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
			},
			defaultMarker:"point/plain-flat/33a02c-48.png",
			editForm:false

		}, me._config);

		if (this.iconPath !== '~/markers/') {
			map.getActionButtons().setIconPath(this.iconPath);
		}


		me._modes = map.getMapModes();


		me._localLayer = new LocalLayerData(this.getDataName(), {});

		me._map = map;



		me._addMarkerMode();
		me._addLineMode();
		me._addTrackingMode();

		me._cameraMarkerMode();

		this._modes.setMode('marker');



		map.on('ready', (event) => {


			if (me._map !== map) {

			}
			me._map = map;
			this._modes.setMode('marker');
			// me._resumeMode();
		});


		console.log('Add local layer data');
		this._localLayer.renderOnMap(map);


		this._addMarkerTapActions();
		this._addLineTapActions();

	}

	public getDataName(){
		let name=this._config.userDataName;
		if(typeof name=='function'){
			name=name();
		}
		return name;
	}

	public getLayer(){
		return this._localLayer;
	}


	public getJsonData() {
		return this._localLayer.getJsonData();
	}


	private _filterFormInput(data){

		if(this._config.editFormFilterInput){
			return this._config.editFormFilterInput(data);
		}

		return data;
	}

	private _filterFormOutput(data){

		if(this._config.editFormFilterOutput){
			return this._config.editFormFilterOutput(data);
		}

		return data;
	}


	public _addMarkerTapActions() {

		const me = this;

		const map: Map = me._map;
		console.log('_addMarkerTapActions');
		map.on("markerSelect", (event:MarkerEventData) => {
			const marker = event.marker;


			if(!this._localLayer.hasMarker(marker)){
				return;
			}

			if(this._config.editForm){

				map.getActionButtons().addEditBtn(() => {

					this._editMarker(marker);

				});
			}


			map.getActionButtons().addRemoveBtn(() => {


				this._localLayer.deleteMarker(marker, () => {
					map.removeMarker(marker);
				});

			});




			map.getActionButtons().show('marker');


		});


	}


	private _editMarker(marker){

		if(this._config.editForm){

			(new Promise((resolve)=>{


				if(marker.userData._id){
					resolve(marker);
				}

			 	this._localLayer.saveMarker(marker).then(()=>{
					 resolve(marker);
				});


			})).then((marker)=>{


			

				getRenderer()._showSubform({
					"form":this._config.editForm,
					"data":this._filterFormInput(marker.userData)
				}, (data)=>{

					let filtered=this._filterFormOutput(data);

					Object.keys(filtered).forEach((key)=>{

						if(key=='icon'&&filtered.icon!=marker.userData.icon){
							this._map.setIcon(marker, filtered.icon);
						}

						marker.userData[key]=filtered[key];



					});

					this._localLayer.saveMarker(marker, () => {

					});

				});

			})

			return;
		}



	}

	public _addLineTapActions() {

		let me = this;
		let map: Map = me._map;
		console.log('_addLineTapActions');
		map.on("shapeSelect", (event:ShapeEventData) => {
			const shape = event.shape;

			if(!this._localLayer.hasLine(shape)||this._localLayer.hasPolygon(shape)){
				return;
			}



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
				'icon': typeof this._config.defaultMarker=="string"?this.iconPath+this._config.defaultMarker:this.iconPath + "point/plain-flat/33a02c-48.png"
			},
			editForm:(marker)=>{
				this._editMarker(marker);
			}
		});
	}





	public _updateCurrentLineIndicators() {
		let me = this;

	}

	public _cameraMarkerMode(){


		const cameraMarker = new CameraMarkerMode(this._map, this._localLayer, {
			defaultMarker: {
				'icon': typeof this._config.defaultMarker=="string"?this.iconPath+this._config.defaultMarker:this.iconPath + "point/plain-flat/33a02c-48.png"
			},
			editForm:(marker)=>{
				this._editMarker(marker);
			}
		});

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




