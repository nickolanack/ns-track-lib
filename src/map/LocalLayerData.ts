import { getConfiguration } from 'tns-mobile-data-collector/src/utils';
 
import { LocalData } from 'tns-mobile-data-collector/src/LocalData';

import { MapBase as Map, MarkerEventData, ShapeEventData} from './MapBase';

import { Observable } from "@nativescript/core";


export class LocalLayerData extends Observable {

	private _dataName: string;

	private _markerList: Array<any> = [];
	private _lineList: Array<any> = [];
	private _polygonList: Array<any> = [];

	private _localData: LocalData;

	constructor(name: string, options) {

		super();

		this._dataName = name;
		this._localData=(new LocalData()).setNamespace(()=>{
			try{
				return getConfiguration().getNamespace();
			}catch(e){}


			console.warn('Using `_localApp` as namespace because no domain is set in configuration');

			return '_localApp';
		});


	}

	public getDataName() {
		return this._dataName;
	}


	public storeAsset(asset, options?){

		return this._localData.storeAsset(asset,options||{})

	}


	public hasMapFeature(id){

		let _id=id.userData||id;
		_id=_id._id||_id;

		if(!(typeof _id=='number'||typeof _id=='string')){
			return false;
		}

		var len = ([]).concat(this._markerList, this._lineList, this._polygonList).filter((item)=>{
			return item._id+''===_id+''
		}).length;


		if(len>0){
			return true;
		}

		return false;

		

	}






	public saveMarker(item, fn?) {
		if(!this.hasMarker(item)){
			this._markerList.push(item);
		}
		return this.saveFeature(item, 'marker', fn);
	}

	public saveLine(item, fn?) {
		if(!this.hasLine(item)){
			this._lineList.push(item);
		}
		return this.saveFeature(item, 'line', fn);
	}

	public savePolygon(item, fn?) {
		if(!this.hasPolygon(item)){
			this._polygonList.push(item);
		}
		return this.saveFeature(item, 'polygon', fn);
	}


	public saveFeature(item, type, callback?) {
		return this._saveFeatureType(item, type).then((featureData)=>{
			if(callback){
				callback(null, featureData);
			}
		}).catch((e)=>{

			if(callback){
				callback(e, null);
			}

			throw e;

		});
	}


	public appendFeature(item, type, callback?) {
		return this._appendFeatureType(item, type).then((featureData)=>{
			if(callback){
				callback(null, featureData);
			}
		}).catch((e)=>{

			if(callback){
				callback(e, null);
			}

			throw e;

		});
	}


	private _isMapItem(item){

		return !!(item.userData);

	}

	private _validateItem(item){

		//is this a feature?

		return true;
	}




	private _saveFeatureType(item, type) {


		return this._updateFeatureType(item, type, (itemData, featureData)=>{





			Object.keys(itemData).forEach((k)=>{
				featureData[k]=itemData[k];
			});



			if(typeof itemData.type=='undefined'){
				// throw 'feature requires .type use _appendFeatureType instead';
				// featureData.type=type;
			}

			if(typeof itemData.coordinates=='undefined'){
				throw 'feature requires .coordinates use _appendFeatureType instead';
			}

			if(typeof featureData.title=='string'&&typeof itemData.title=='undefined'){
				throw 'feature missing .title use _appendFeatureType instead';
			}

			if(typeof featureData.description=='string'&&typeof itemData.description=='undefined'){
				throw 'feature missing .description use _appendFeatureType instead';
			}


			Object.keys(featureData).forEach((k)=>{

				if(typeof itemData[k]=='undefined'){
					delete featureData[k];
				}
			});

			featureData.type=type; //force type

		});

	}


	private _appendFeatureType(item, type) {


		return this._updateFeatureType(item, type, (itemData, featureData)=>{

			if(Object.keys(featureData).length==1&&featureData._id){
				throw 'attempted to add new item on _appendFeatureType';
			}


			Object.keys(itemData).forEach((k)=>{
				featureData[k]=itemData[k];
			});


		});

	}


	private _updateFeatureType(item, type, updateFn) {






		let featureData;
		let featureList;


		let itemData=item.userData||item;

		return this._getFeatureList().then((list:Array<any>) => {

			
			featureList=list;

			return this._resolveFeature(featureList, itemData);

		}).then((featureData:any)=>{

			let _id=featureData._id;




			updateFn(itemData, featureData);
	
			featureData._id=_id;
			featureData._store = [this._localData.getNamespace(), this._dataName];
			featureData.type = type;


			return this._storeAndNotifySave(featureList, item, featureData);

		});



	}



	private _getFeatureList(){

		return this._localData.getValue(this._dataName, []);

	}

	private _resolveFeature(list, itemData){


		return new Promise((resolve)=>{


			if(!this._validateItem(itemData)){
				throw 'invalid item'
			}

			if (!itemData._id) {
				throw 'does not contain a valid _id:';
			}

			let features=list.filter((f)=>{
				return f._id == itemData._id;
			});



			if(features.length==0){

				let newItemData={
					_id: (new Date()).getTime() + "." + list.length
				}
				list.push(newItemData);
				resolve(newItemData);
				
				return;

			}

			resolve(features[0]);

		});

	}


	private _storeAndNotifySave(list, itemIn, itemData){

		return this._localData.setValue(this._dataName, list).then(() => {

			let type=itemData.type;

			this.notify({
				"eventName": "save" + type[0].toUpperCase() + type.slice(1),

				object: this,
				feature:this._isMapItem(itemIn)?itemIn:null,
				item:itemData
			});

			this.notify({
				"eventName": "saveFeature",
				"type": type,
				
				object: this, 
				feature:this._isMapItem(itemIn)?itemIn:null,
				item:itemData
			});


			return itemData;

		});

	}


	public getJsonData() {

		return this._localData.getValue(this._dataName, []);

	}



	/**
	 *  hasMarker, hasLine, hasPolygon only check if the features were added to the map by calling renderOnMap
	 */

	public hasMarker(marker) {
		return this._isMapItem(marker)&&this._markerList.indexOf(marker) >= 0;
	}

	public hasLine(line) {
		return this._isMapItem(line)&&this._lineList.indexOf(line) >= 0;
	}

	public hasPolygon(poly) {
		return this._isMapItem(poly)&&this._polygonList.indexOf(poly) >= 0;
	}

	public hasShape(shape) {
		return this._isMapItem(shape)&&(this._lineList.indexOf(shape) >= 0||this._polygonList.indexOf(shape) >= 0);
	}



	public renderOnMap(map:Map) {

		let local =this._localData.getValue(this._dataName, []).then((list:Array<any>) => {
			console.log("usersMapFeatures:" + JSON.stringify(list));
			list.forEach((feature) => {



				if(typeof feature.coordinates=='undefined'){
					console.error('invalid feature, missing coordinates: '+JSON.stringify(feature));
				}


				if (((!feature.type) && typeof feature.coordinates[0] == "number") || feature.type == "marker") {

					feature.clickable = true; // force clickable
					feature.type='marker';

					map.addMarker(feature).then((marker) => {
						this._markerList.push(marker);
						this.notify({
							eventName: "addMarker",
							object:this,
							marker: marker
						});
					}).catch(console.error);


					return;
				}

				if (((!feature.type) && typeof feature.coordinates[0] != "number") || feature.type == "line") {

					feature.clickable = true; // force clickable
					feature.type="line"

					map.addLine(feature).then((line) => {
						this._lineList.push(line);
						this.notify({
							eventName: "addLine",
							object:this,
							line: line
						});
					}).catch(console.error);

					return;
				}
				if (feature.type == "polygon") {

					feature.clickable = true; // force clickable

					map.addPolygon(feature).then((polygon) => {
						this._polygonList.push(polygon);
						console.log('notify addPolygon');
						this.notify({
							eventName: "addPolygon",
							object:this,
							polygon: polygon
						});
					}).catch(console.error);
				}
			});
		});

	}

	public deleteMarker(marker, fn) {
		this._markerList.splice(this._markerList.indexOf(marker), 1);
		this._deleteFeature(marker, "marker", fn);

	}
	public deleteLine(shape, fn) {

		this._lineList.splice(this._lineList.indexOf(shape), 1);
		this._deleteFeature(shape, "line", fn);

	}
	public deletePolygon(shape, fn) {

		this._polygonList.splice(this._polygonList.indexOf(shape), 1);
		this._deleteFeature(shape, "polygon", fn);

	}
	private _deleteFeature(item, type, callback) {


		let _id=item.userData||item;
		_id=_id._id||_id;


	
		return this._localData.getValue(this._dataName, []).then((list:Array<any>) => {

			
			if(!_id) {
				throw 'does not contain a valid _id:';
			}

			let remove = list.filter((feature) => {
				return (feature._id == _id);
			});

		
			if (remove.length==0) {
				throw 'failed to delete: not found: ' +_id;
			}


			list=list.filter((f)=>{
				return remove.indexOf(f)===-1;
			});

			return this._localData.setValue(this._dataName, list).then(() => {
				


				if (callback) {
					callback(null, remove[0]);
				}

				this.notify({
					"eventName": "remove" + type[0].toUpperCase() + type.slice(1),
					object:this,
					feature: this._isMapItem(item)?item:null,
					item:remove[0]
				});

				this.notify({
					"eventName": "removeFeature",
					"type": type,
					object: this,
					feature: this._isMapItem(item)?item:null,
					item:remove[0]
				});


				return remove[0];
			});

		}).catch((e)=>{

			console.error(e);
			

			if (callback) {
				callback(e, null);
			}

			throw e;

		});
	}




}