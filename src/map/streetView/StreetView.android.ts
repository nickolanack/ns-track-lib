import { StreetViewBase } from "./StreetViewBase";
import {Application, AndroidApplication, Screen} from "@nativescript/core"
import { distance, sigmondRolloff } from "../../spatial/Spherical"

import { extend } from 'tns-mobile-data-collector/src/utils';

import { StreetViewMarkers } from "./overlay/StreetViewMarkers"

export class StreetView extends StreetViewBase {

	protected panorama: com.google.android.gms.maps.StreetViewPanoramaView|null;
	
	public  setPanoId(id: string, callback?): Promise<void>{

		return new Promise((resolve) => {
			this.panorama.setPosition(id);
			resolve();
		});

	}



	public setCenter(pos: Array<number>, callback?): Promise<void> {

		return new Promise((resolve) => {
			this.panorama.setPosition(new com.google.android.gms.maps.model.LatLng(pos[0], pos[1]), 20);
			resolve();
		});
	}

	public setZoom(zoom: number, callback?): Promise<void>{

		return new Promise((resolve) => {

			let duration=100;
			this.panorama.animateTo(
				com.google.android.gms.maps.model.StreetViewPanoramaCamera.Builder(this.panorama.getPanoramaCamera())
					.zoom(zoom)
					.build(),
				duration);
			setTimeout(resolve, duration);

		});


	}

	public setTilt(tilt: number, callback?): Promise<void>{

		return new Promise((resolve) => {

			let duration=100;
			this.panorama.animateTo(
				com.google.android.gms.maps.model.StreetViewPanoramaCamera.Builder(this.panorama.getPanoramaCamera())
					.tilt(tilt)
					.build(),
				duration);
			setTimeout(resolve, duration);
			
		});


	}

	public setHeading(heading: number, callback?): Promise<void>{

		return new Promise((resolve) => {

			let duration=1000;
			this.panorama.animateTo(
				com.google.android.gms.maps.model.StreetViewPanoramaCamera.Builder(this.panorama.getPanoramaCamera())
					.bearing(heading-this._headingAdjust)
					.build(),
				duration);

			setTimeout(resolve, duration);

		});


	}


	protected _showMarker(marker){
		//console.error('Not implemented!: StreetView.android.showMarker');


		if(!this._streetViewMarkers){
			this._streetViewMarkers=new StreetViewMarkers(this);
		}

		this._streetViewMarkers.add(marker);

		
	}


	


	public setIcon(marker: Marker, image) {


		return super.setIcon(marker, image).then((marker)=>{

			if(this._streetViewMarkers){
				this._streetViewMarkers.updateMarkerIcon(marker);
			}
			return marker;
		}).catch((e)=>{
			console.error(e);
		})
		
		

	};


	createNativeView() {

		const streetViewPanoramaOptions = new com.google.android.gms.maps.StreetViewPanoramaOptions();
		// streetViewPanoramaOptions.userNavigationEnabled(false);
		// streetViewPanoramaOptions.panoramaId('AF1QipPdrvrknyKzD8st67731q_wgSvLVulUlRDs-64');

		const streetView = new com.google.android.gms.maps.StreetViewPanoramaView(this._context, streetViewPanoramaOptions);
		this.nativeView = streetView;

		if(!this._streetViewMarkers){
			this._streetViewMarkers=new StreetViewMarkers(this);
		}

		this.onceOrientation((orientation)=>{
			this.alignMarkers();
		});

		return this.nativeView;
	}

	



	

	public notifyClick(orientation){
		console.log('click: '+JSON.stringify(orientation));

		if(this._streetViewMarkers){
			//this is just for debugging
			this._streetViewMarkers.notifyClick(orientation);
		}
	}

	




	private initStreetView() {

		const streetView = this.nativeView;

		let ref = new WeakRef(this);
		streetView.getStreetViewPanoramaAsync(new com.google.android.gms.maps.OnStreetViewPanoramaReadyCallback({
			onStreetViewPanoramaReady: (panorama: com.google.android.gms.maps.StreetViewPanorama) => {


				let owner = ref.get();
				owner.panorama = panorama;

				

                panorama.setOnStreetViewPanoramaCameraChangeListener(new com.google.android.gms.maps.StreetViewPanorama.OnStreetViewPanoramaCameraChangeListener({
                	onStreetViewPanoramaCameraChange:(camera:com.google.android.gms.maps.model.StreetViewPanoramaCamera)=>{

                		let orientation={bearing:camera.bearing, tilt:camera.tilt, zoom:camera.zoom};
                		
                		if(JSON.stringify(owner._lastOrientation)!==JSON.stringify(orientation)){
                			/**
                			 * prevent too much logging
                			 */
                			owner.notifyAlign(orientation);
                			
                			
                		}
                	}
                }));


                 panorama.setOnStreetViewPanoramaChangeListener(new com.google.android.gms.maps.StreetViewPanorama.OnStreetViewPanoramaChangeListener({
                	onStreetViewPanoramaChange:(location:com.google.android.gms.maps.model.StreetViewPanoramaLocation)=>{

                		let position={latitude:location.position.latitude, longitude:location.position.longitude};

                		if(JSON.stringify(owner._lastPosition)!==JSON.stringify(position)){
                			/**
                			 * prevent too much logging
                			 */
                			//console.log(position);
                			owner._lastPosition=position;

                			owner.notify({
								eventName: 'positionChanged',
								object: owner,
								position: position,
								type: "marker"
							});
                		}
                	}
                }));


                 panorama.setOnStreetViewPanoramaClickListener( new com.google.android.gms.maps.StreetViewPanorama.OnStreetViewPanoramaClickListener({

                 	onStreetViewPanoramaClick:(panoramaOrientation:com.google.android.gms.maps.model.StreetViewPanoramaOrientation)=>{
                 		try{
                 			let orientation={bearing:panoramaOrientation.bearing, tilt:panoramaOrientation.tilt};
                			owner.notifyClick(orientation); 
                		}catch(e){
                			console.error(e);
                			console.error('onStreetViewPanoramaClick error')
                		}
                 	}

                 }));

                
               
                owner.initPanorama();



				// const location=panorama.getLocation();
				// panorama.setPosition(new com.google.android.gms.maps.model.LatLng(45.3323855,14.4551634), 20);
			}
		}));

		streetView.onCreate(null);
		streetView.onResume();
	}

	initNativeView(): void {
		super.initNativeView();
		this.initStreetView();
	}

	onLoaded() {
        super.onLoaded();

        let application = require("@nativescript/core").Application;

        Application.android.on(AndroidApplication.activityPausedEvent, this.onActivityPaused, this);
        Application.android.on(AndroidApplication.activityResumedEvent, this.onActivityResumed, this);
        Application.android.on(AndroidApplication.saveActivityStateEvent, this.onActivitySaveInstanceState, this);
        Application.android.on(AndroidApplication.activityDestroyedEvent, this.onActivityDestroyed, this);
    }

    onUnloaded() {
        super.onUnloaded();

        let application = require("@nativescript/core").Application;

        Application.android.off(AndroidApplication.activityPausedEvent, this.onActivityPaused, this);
        Application.android.off(AndroidApplication.activityResumedEvent, this.onActivityResumed, this);
        Application.android.off(AndroidApplication.saveActivityStateEvent, this.onActivitySaveInstanceState, this);
        Application.android.off(AndroidApplication.activityDestroyedEvent, this.onActivityDestroyed, this);
    }

	private onActivityPaused(args) {
		if (!this.nativeView || this._context != args.activity) return;
		this.nativeView.onPause();
	}

	private onActivityResumed(args) {
		if (!this.nativeView || this._context != args.activity) return;
		this.nativeView.onResume();
	}

	public disposeNativeView() {
        if (this.nativeView) {
            this.nativeView.onDestroy();
        }

        this._context = undefined;

        super.disposeNativeView();
    }

    private onActivitySaveInstanceState(args) {
        if (!this.nativeView || this._context != args.activity) return;
        this.nativeView.onSaveInstanceState(args.bundle);
    }
     private onActivityDestroyed(args) {
        if (!this.nativeView || this._context != args.activity) return;
        this.nativeView.onDestroy();
    }
}



