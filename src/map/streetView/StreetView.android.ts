import { StreetViewBase } from "./StreetViewBase";
import {Application, AndroidApplication, Screen} from "@nativescript/core"
import { distance, sigmondRolloff } from "../../spatial/Spherical"


export class StreetView extends StreetViewBase {

	protected panorama: com.google.android.gms.maps.StreetViewPanoramaView|null;
	protected _closestMarker:any=null;
	protected _closestD:number=Infinity;


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
					.bearing(heading)
					.build(),
				duration);

			setTimeout(resolve, duration);

		});


	}


	protected _showMarker(marker){
		//console.error('Not implemented!: StreetView.android.showMarker');



		let origin=this.getPosition();
		if(!origin){

			if(!this._queueMarker){
				this._queueMarker=[];
				this.oncePosition().then(()=>{
					this._queueMarker.forEach(this._showMarker.bind(this));
					delete this._queueMarker;
				});
			}

			this._queueMarker.push(marker);
			return;

		}

		if(!this._markers){
			this._markers=[];
			this._views=[];
		}
	
		let image=new android.widget.ImageView(this._context);
		image.setImageBitmap(marker.icon.imageSource.android);

		this._alignMarker(marker, image, origin);


		image.getLayoutParams().height = marker.icon.imageSource.android.getHeight();
		image.getLayoutParams().width  = marker.icon.imageSource.android.getWidth();


		image.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_TOP);
		image.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_LEFT);

		//image.getLayoutParams().leftMargin  = 100+(Math.random()*(Screen.mainScreen.widthPixels-100));
		image.getLayoutParams().topMargin = 100;//Screen.mainScreen.heightPixels/2;
		

		let ref = new WeakRef(this);
		let refMarker=new WeakRef(marker);

		image.setOnTouchListener(new android.view.View.OnTouchListener({
	        onTouch: function (view, event) {

	        	
	        	if (event.getActionMasked()==android.view.MotionEvent.ACTION_UP) {
            
		           	ref.get()._notifyMarkerTapped(refMarker.get());
		        	
		        }
		        return true;
	        },
	    }));


		if(this._markers.indexOf(marker)==-1){
			this._markers.push(marker);
			this._views.push(image);
		}

	}


	private _alignMarker(marker, image, origin){

		let p=marker.position;
		let x=p.longitude-origin.longitude;
		let y=p.latitude-origin.latitude;
		//let angle=Math.atan2(x, y)*(180/Math.PI)*(this._markers0to180.getWidth()/180);
		let angle=Math.atan2(x, y)*(this._markers0to180.getWidth()/Math.PI);
		
		let bearing=angle+180;
		
		
		if(!image.getParent()){
			if(angle<0){
				angle=180-angle;
				this._markers180to360.addView(image);
			}else{
				this._markers0to180.addView(image);
			}
		}





		image.setTranslationX(angle);


		let d =distance(p, origin);
		let altitude=marker.userData.coordinates.length==3?marker.userData.coordinates[2]:0;
		let originAltitude=this.getAltitude();

		// if(d<this._closestD){
		// 	this._closestD=d;
		// 	this._closestMarker=marker;
		// }

		let scale=sigmondRolloff(d);
		image.setScaleX(scale);
		image.setScaleY(scale);

		image.setZ(scale); //draw order;





		let elevationAngle=Math.atan2((altitude-originAltitude),d)*(this._markers0to180.getHeight()/Math.PI);
		image.setTranslationY(elevationAngle);	

		marker.userData=marker.userData||{};
		marker.userData.orientation={
			bearing:bearing,
			tilt:elevationAngle,
			distance:d
		};


	}


	public setIcon(marker: Marker, image) {


		return super.setIcon(marker, image).then((marker)=>{

			if(!(this._markers&&this._markers.indexOf(marker)>=0)){
				return marker;
			}

			let i =this._markers.indexOf(marker);
			if(this._views[i]){
				this._views[i].setImageBitmap(marker.icon.imageSource.android);
			}

			return marker;
		}).catch((e)=>{
			console.error(e);
		})
		
		

	};



	public getOrientation(){
		return this._lastOrientation;
	}
	public getPosition(){
		return this._lastPosition;
	}


	createNativeView() {

		const streetViewPanoramaOptions = new com.google.android.gms.maps.StreetViewPanoramaOptions();
		// streetViewPanoramaOptions.userNavigationEnabled(false);
		// streetViewPanoramaOptions.panoramaId('AF1QipPdrvrknyKzD8st67731q_wgSvLVulUlRDs-64');

		const streetView = new com.google.android.gms.maps.StreetViewPanoramaView(this._context, streetViewPanoramaOptions);
		this.nativeView = streetView;

		this._markerLayer = new android.widget.FrameLayout(this._context);
		this._markerLayer.setLayoutParams(new android.widget.FrameLayout.LayoutParams(
		                                     android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
		                                      android.widget.FrameLayout.LayoutParams.MATCH_PARENT));


		this._markerLayer.setClipChildren(false);
		this._markerLayer.setClipToPadding(false);

		streetView.addView(this._markerLayer);

		this._markers0to180=this.makeView180('0','180');
		this._markers180to360=this.makeView180('180','360');
		//this._markers180to360.setBackgroundColor(android.graphics.Color.BLUE);


		this._label('0', this._markers0to180, 'bottom-left');
		this._label('180', this._markers0to180, 'top-right');
		this._label('180', this._markers180to360, 'bottom-left');
		this._label('360', this._markers180to360, 'top-right');

		this.onceOrientation((orientation)=>{
			this.alignMarkers();
		});

		return this.nativeView;
	}

	private makeView180(labels){
		let view=new android.widget.RelativeLayout(this._context);

		view.setLayoutParams(new android.widget.FrameLayout.LayoutParams(Screen.mainScreen.widthPixels*2, 500));


		view.setClipChildren(false);
		view.setClipToPadding(false);
	
		//view.setBackgroundColor(android.graphics.Color.parseColor("#70"+this._H()+this._H()+this._H()));
		
		this._markerLayer.addView(view);

		//view.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_TOP);
		//view.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_LEFT);

		return view;
	}




	private _H(){
		var h=((Math.round(Math.random()*255)).toString(16).toUpperCase())
		if(h.length==1){
			h='0'+h;
		}
		return h;
	}


	private _label(textContent, parentView, pos){


		let text=new android.widget.TextView(this._context);

		text.setText(textContent);
		parentView.addView(text);

		if(pos&&pos.indexOf('bottom')>=0){
			text.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_BOTTOM);
		}else{
			text.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_TOP);
		}

		if(pos&&pos.indexOf('right')>=0){
			text.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT);
		}else{
			text.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_LEFT);

		}

		text.setTranslationX(0);
		text.setTranslationY(0);

	}

	
	private alignMarkers(){
		let orientation=this.getOrientation();
		let bearing=orientation.bearing;
		let tilt=orientation.tilt;
		let zoom=orientation.zoom;

		let width180=this._markers0to180.getWidth();

		let offset=(Screen.mainScreen.widthPixels/2)-(bearing*(width180/180));//(this._markers0to180.getLayoutParams().width/180)*bearing;
		console.log(JSON.stringify(orientation));

		var z=Math.pow(2, zoom);

		this._markers0to180.setLayoutParams(new android.widget.FrameLayout.LayoutParams(Screen.mainScreen.widthPixels*2*z, 500*z));
		this._markers180to360.setLayoutParams(new android.widget.FrameLayout.LayoutParams(Screen.mainScreen.widthPixels*2*z, 500*z));

		this._markers0to180.setTranslationX(offset>-width180?offset:offset+2*width180);	
		this._markers180to360.setTranslationX(offset+((offset>0)?-1:1)*width180);


		let y=(this._markerLayer.getHeight()/2)-(this._markers0to180.getHeight()/2);



		y+=Math.sin(tilt*Math.PI/180)*Screen.mainScreen.heightPixels/2;

		
		this._markers0to180.setTranslationY(y);
		this._markers180to360.setTranslationY(y);


		//this._markers0to180.requestLayout();
		//this._markers180to360.requestLayout();

		var origin=this.getPosition();
		this._markers.forEach((marker,i)=>{
			this._alignMarker(marker, this._views[i], origin);
		})
	
	}


	public notifyAlign(orientation){

		

		this._lastOrientation=orientation;

		this.notify({
			eventName: 'orientationChanged',
			object: this,
			orientation: orientation,

		});
        this.alignMarkers();
	}

	public notifyClick(orientation){
		console.log('click: '+JSON.stringify(orientation));

		let closest=null;
		let dist=Math.Infinity;
		this._markers.forEach((m)=>{
			
			let b=orientation.bearing-m.userData.orientation.bearing;
			let t=orientation.tilt-m.userData.orientation.tilt;

			let distSqr=b*b+t*t; //no point computing sqrt since it is for comparison
			if(distSqr<dist){
				closest=m;
				dist=distSqr;
			}

		});
	}

	public oncePosition(){

		if(this._lastPosition){
			return Promise.resolve(this._lastPosition)
		}

		return new Promise((resolve)=>{
			this.once("positionChanged", (event)=>{
				resolve(event.position);
			});
		});



	}


	public onceOrientation(){

		if(this._lastOrientation){
			return Promise.resolve(this._lastOrientation)
		}

		return new Promise((resolve)=>{
			this.once("orientationChanged", (event)=>{
				resolve(event.orientation);
			});
		});



	}




	private initStreetView() {

		const streetView = this.nativeView;

		let ref = new WeakRef(this);
		streetView.getStreetViewPanoramaAsync(new com.google.android.gms.maps.OnStreetViewPanoramaReadyCallback({
			onStreetViewPanoramaReady: (panorama: com.google.android.gms.maps.StreetViewPanorama) => {


				let owner = ref.get();
				owner.panorama = panorama;

				
                owner._lastOrientation=null;
                owner._lastPosition=null;

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

                		if(JSON.stringify(this._lastPosition)!==JSON.stringify(position)){
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


                 panorama.setOnStreetViewPanoramaClickListener(new  com.google.android.gms.maps.StreetViewPanorama.OnStreetViewPanoramaClickListener({

                 	onStreetViewPanoramaClick:(panoramaOrientation:com.google.android.gms.maps.model.StreetViewPanoramaOrientation)=>{
                 		let orientation={bearing:panoramaOrientation.bearing, tilt:panoramaOrientation.tilt};
                		owner.notifyClick(orientation); 
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



