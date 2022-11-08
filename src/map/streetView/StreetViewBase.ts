import { ContentView } from "@nativescript/core";
import { getRenderer } from 'tns-mobile-data-collector/src/utils';
import { LayerLoader } from '../LayerLoader';
import { FeatureLoader } from '../FeatureLoader';


import {Marker} from 'nativescript-google-maps-sdk';

export abstract class StreetViewBase extends ContentView {

	protected field: any;
	protected _renderer;
	protected altitude:number=0;
	protected _layers:any;

	protected _headingAdjust:number=0;

	public constructor(field?: any) {
		super();

		this.field = field;
		this._renderer = getRenderer();



	}


	public abstract setPanoId(id: string, callback?): Promise<void>;
	public abstract setCenter(pos: Array<number>, callback?): Promise<void>;
	public abstract setHeading(heading: number, callback?): Promise<void>;
	public setAltitude(altitude: number){
		this.altitude=altitude;
	}

	public getAltitude(){
		return this.altitude;
	}


	initPanorama() {
		this.notifyPanoramaReady();
		this.loadLayers();
	}

	notifyPanoramaReady() {




		if(this.field.id){

			if (typeof this.field.id == 'string' && this.field.id[0] == '{') {
				this.field.id = this._renderer._parse(this.field.id);
			}
		}


		if(this.field.headingAdjust){
			if (typeof this.field.headingAdjust == 'string' && this.field.headingAdjust[0] == '{') {
				this._headingAdjust = this._renderer._parse(this.field.headingAdjust);
			}
		}


		if(this.field.heading){
			if (typeof this.field.heading == 'string' && this.field.heading[0] == '{') {
				this.field.heading = this._renderer._parse(this.field.heading);
			}
		}

		if (this.field.center) {
			if (typeof this.field.center == 'string' && this.field.center[0] == '{') {
				this.field.center = this._renderer._parse(this.field.center);
			}

		}

		if(this.field.altitude){

			if (typeof this.field.altitude == 'string' && this.field.altitude[0] == '{') {
				this.field.altitude = this._renderer._parse(this.field.altitude);
			}

			this.setAltitude(this.field.altitude);
		}
		


		if(this.field.id){
			this.setPanoId(this.field.id);
			this.setHeading(this.field.heading||0);
			return;
		}
		


		if(this.field.url){
			//parse panoid;

		}


		if (this.field.center) {
			this.setCenter(this.field.center);
			this.setHeading(this.field.heading||0);
			//this.setZoom(this.field.heading||0)
			return;
		}


		

	}


	public abstract getOrientation():any;


	public addMarker(item:Object){
		return (new FeatureLoader()).loadMarker(item).then((marker)=>{

			this.notify({
				eventName: 'addFeature',
				object: this,
				item: marker,
				type: "marker"
			});

			return marker;
		})
	}

	protected abstract _showMarker(marker);

	public setIcon(marker: Marker, image) {

		return (new FeatureLoader()).setIcon(marker, image);

	};


	protected _notifyMarkerTapped(marker){
		this.notify({
			eventName: 'markerSelect',
			object: this,
			marker: marker,
		});
	}


	public loadLayers(){

		(new LayerLoader(this.field)).loadLayers([36], (layer, list)=>{

			//this._layerObjects.push(layer);

			list.forEach((item) => {


				console.log('StreetViewBase.Add Layer Item: ' + item.type);

				if ((!item.type) || item.type == "marker") {
					this.addMarker(item).then((marker) => {
						layer.addItem(marker, item);
						this._showMarker(marker);
					}).catch((e)=>{

						console.error('Failed to display marker');
						console.error(e);

					});
				}
				
			});
		});


	}


}