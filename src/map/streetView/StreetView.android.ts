import { StreetViewBase } from "./StreetViewBase";
import {Application, AndroidApplication} from "@nativescript/core"

export class StreetView extends StreetViewBase {

	protected panorama: com.google.android.gms.maps.StreetViewPanoramaView|null;




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
					.bearing(heading)
					.build(),
				duration);

			setTimeout(resolve, duration);

		});


	}



	createNativeView() {

		const streetViewPanoramaOptions = new com.google.android.gms.maps.StreetViewPanoramaOptions();
		// streetViewPanoramaOptions.userNavigationEnabled(false);
		// streetViewPanoramaOptions.panoramaId('AF1QipPdrvrknyKzD8st67731q_wgSvLVulUlRDs-64');

		const streetView = new com.google.android.gms.maps.StreetViewPanoramaView(this._context, streetViewPanoramaOptions);
		this.nativeView = streetView;
		return this.nativeView;
	}



	initStreetView() {

		const streetView = this.nativeView;

		let ref = new WeakRef(this);
		streetView.getStreetViewPanoramaAsync(new com.google.android.gms.maps.OnStreetViewPanoramaReadyCallback({
			onStreetViewPanoramaReady: (panorama: com.google.android.gms.maps.StreetViewPanorama) => {


				let owner = ref.get();
                owner.panorama = panorama;
                owner.notifyPanoramaReady();


                panorama.setOnStreetViewPanoramaCameraChangeListener(new com.google.android.gms.maps.StreetViewPanorama.OnStreetViewPanoramaCameraChangeListener({
                	onStreetViewPanoramaCameraChange:(camera:com.google.android.gms.maps.model.StreetViewPanoramaCamera)=>{

                		console.log({bearing:camera.bearing, tilt:camera.tilt, zoom:camera.zoom});
                	}
                }))


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



