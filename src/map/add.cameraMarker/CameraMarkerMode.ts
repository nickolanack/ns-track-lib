import { MapBase as Map, MarkerEventData} from '../MapBase';
import { LocalLayerData } from '../LocalLayerData';
import { extend, getRenderer} from 'tns-mobile-data-collector/src/utils';
import { Location } from '../../Location';



import { Permission } from 'tns-mobile-data-collector/src/Permission';

export class CameraMarkerMode {

	private _map: Map;
	private _config: any;
	private _camera: any;
	private _currentMarker: any;
	private _localLayer: LocalLayerData;

	constructor(map: Map, layer: LocalLayerData, options?: any) {


		this._map = map;
		this._localLayer = layer;
		this._config = extend({
			saveToGallery:false,
			selfie:false,
			defaultMarker: {},
			editForm:null
		}, options || {});


		map.addAction('takePhoto', () => {

			this.createPhotoMarker();
				
		});

		this._addMarkerTapActions();

	}




	public createPhotoMarker(){

		let location = new Location();
				
		Promise.all([location.getPosition(), this.getCamera()]).then((res)=>{

			return res[1].takePicture({
				cameraFacing: (!!this._config.selfie) ? "front" : "back",
				width: 500,
				height: 500,
				keepAspectRatio: true,
				saveToGallery: this._config.saveToGallery
			}).then((imageAsset)=>{


				

				if(typeof imageAsset=="undefined"){
					throw 'imageAsset was empty';
				}
				return this._localLayer.storeAsset(imageAsset);
				
			}).then((assetData)=>{
				return res.concat([assetData]);
			})

			

		}).then((res)=>{


			let loc=res[0];
			let assetData=res[2];



			return this._map.addMarker(extend({
				'title': "Test",
				'coordinates': [loc.latitude, loc.longitude/*, loc.altitude*/],
				'media':[assetData]

			}, this._config.defaultMarker)).then((marker) => {

				this._currentMarker=marker;
				
				 this._map.selectMarker(marker);
				 this._map.setPosition(marker, [loc.latitude, loc.longitude/*, loc.altitude*/]);


				 if(this._config.editForm){


				 	if(typeof this._config.editForm=='function'){
				 		delete this._currentMarker;
				 		this._config.editForm(marker);
				 		return;
				 	}

					return;
				}


			});


		}).catch((e)=>{

				console.error(e);
				console.error(e.stack);
				console.log("Error creating photo marker");
		
		});


			
			
	}


	public _addMarkerTapActions() {


		const map: Map = this._map;

		map.on("markerSelect", (event:MarkerEventData) => {
			const marker = event.marker;
			const buttons = [];

			if (marker === this._currentMarker) {


				map.getActionButtons().addSaveBtn(() => {

					this._localLayer.saveMarker(marker).then(()=>{
						delete this._currentMarker;
					}).catch((e)=>{
						console.error('CameraMarkerMode Failed to save marker');
						console.error(e);
					});


				});

				map.getActionButtons().addRemoveBtn(() => {


					map.removeMarker(marker);
					delete this._currentMarker;

				});


			}


			map.getActionButtons().show('marker');


		});


	}



	private getCamera(){

		if(this._camera){
			return Promise.resolve(this._camera);
		}


		let permissions = ["camera"];

		if (this._config.saveToGallery) {
			permissions.push("filewrite:optional");
		}

		return (new Permission()).requirePermissionFor(permissions).then((object) => {

			let camera = object.camera;

			if (!camera) {
				throw object.cameraError;
			}

			this._camera = camera;
			return camera;

		});

	}



}