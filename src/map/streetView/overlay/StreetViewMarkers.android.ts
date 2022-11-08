import {Screen} from "@nativescript/core"
import { distance, sigmondRolloff } from "../../../spatial/Spherical"


export class StreetViewMarkers{

	private _streetview:any=null;
	private _views:Array<any>=[];
	private _markers:Array<any>=[];

	private _queueMarker:any=null;


	// protected _closestMarker:any=null;
	// protected _closestD:number=Infinity;



	constructor(streetview){

		this._streetview=streetview;



		this._initViews();

	}





	public updateMarkerIcon(marker){


		if(!(this._markers&&this._markers.indexOf(marker)>=0)){
			return marker;
		}

		let i =this._markers.indexOf(marker);
		if(this._views[i]){
			this._views[i].setImageBitmap(marker.icon.imageSource.android);
		}

	}




	public notifyClick(orienation){

		if(!this.hasMarkers()){
			return;
		}


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
	



	public add(marker){



		let origin=this._streetview.getPosition();
		if(!origin){

			if(!this._queueMarker){
				this._queueMarker=[];
				this._streetview.oncePosition().then(()=>{
					this._queueMarker.forEach(this.add.bind(this));
					delete this._queueMarker;
				});
			}

			this._queueMarker.push(marker);
			return;

		}
		
		try{

			let image=this._createMarkerView(marker);
		
			this._alignMarker(marker, image, origin);	

			if(this._markers.indexOf(marker)==-1){
				this._markers.push(marker);
				this._views.push(image);
			}

		}catch(e){
			console.error(e);
			console.error('Failed to display marker');

		}



		
	}





	private _alignMarker(marker, image, origin){

		let p=marker.position;
		let x=p.longitude-origin.longitude;
		let y=p.latitude-origin.latitude;
		//let angle=Math.atan2(x, y)*(180/Math.PI)*(this._markers0to180.getWidth()/180);
		

		let horizontalDegrees=Math.atan2(x, y)*(180.0/Math.PI); //(this._markers0to180.getWidth()/Math.PI);
		
		

		let d =distance(p, origin);
		let altitude=marker.userData.coordinates.length==3?marker.userData.coordinates[2]:0;
		let originAltitude=this._streetview.getAltitude();

		let deltaAltitude=altitude-originAltitude


		let scale=sigmondRolloff(d);
		

		let verticalDegrees=Math.atan2(deltaAltitude, d)*(180.0/Math.PI);
		

		this._alignMarkerView(marker, image, horizontalDegrees, verticalDegrees, scale);


		marker.userData=marker.userData||{};
		marker.userData.orientation={
			bearing:horizontalDegrees,
			tilt:verticalDegrees,
			distance:d
		};


	}



	private _alignMarkerView(marker, image, horizontalDegrees, verticalDegrees, scale){



		console.log(marker.userData.name+' '+horizontalDegrees);

		let pixelsPerDegree=this._markers0to180.getWidth()/180.0;
		let angleXPixels=horizontalDegrees*pixelsPerDegree;


		let angleYPixels=verticalDegrees*pixelsPerDegree;

		let containerRelativeXPixels=angleXPixels;
		if(angleXPixels<0){
			containerRelativeXPixels=this._markers0to180.getWidth()-containerRelativeXPixels;
		}

		if(!image.getParent()){

			if(angleXPixels<0){
				this._markers180to360.addView(image);
			}else{
				this._markers0to180.addView(image);
			}


			image.getLayoutParams().height = marker.icon.imageSource.android.getHeight();
			image.getLayoutParams().width  = marker.icon.imageSource.android.getWidth();


			image.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_TOP);
			image.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_LEFT);

			//image.getLayoutParams().leftMargin  = 100+(Math.random()*(Screen.mainScreen.widthPixels-100));
			//Screen.mainScreen.heightPixels/2;
		}

		//image.getLayoutParams().topPadding = 100*scale;
		image.setTranslationX(containerRelativeXPixels);



		image.setScaleX(scale);
		image.setScaleY(scale);

		image.setZ(scale); //draw order;


		let verticalCenter=this._markers0to180.getHeight()/2.0


		image.setTranslationY(verticalCenter-angleYPixels);	//positive angle is up, but -pixel is uo



	}






	public hasMarkers(){
		return this._markers&&this._markers.length>0;
	}


	private _throttleLogOrientation(){

		if(this._throttleLogOrientationTimeout){
			clearTimeout(this._throttleLogOrientationTimeout);
		}
		
		this._throttleLogOrientationTimeout=setTimeout(()=>{
			this._throttleLogOrientationTimeout=null;
			console.log(JSON.stringify(this._streetview.getOrientation()));
		}, 500);
	

	}
	

	
	public alignMarkers(){

		let orientation=this._streetview.getOrientation();
		let bearing=orientation.bearing;
		let tilt=orientation.tilt;
		let zoom=orientation.zoom;

		this._throttleLogOrientation();

		this._scale180Containers();
		this._align180Containers();



		if(!this.hasMarkers()){
			return;
		}


		//this._markers0to180.requestLayout();
		//this._markers180to360.requestLayout();

		var origin=this._streetview.getPosition();




		this._markers.forEach((marker,i)=>{
			this._alignMarker(marker, this._views[i], origin);
		})
	
	}


	private _scale180Containers(){


		let zoom=this._streetview.getOrientation().zoom;

		var z=Math.pow(2, zoom);


		let w=this._markerLayer.getWidth()//Screen.mainScreen.widthPixels;
		let h=this._markerLayer.getHeight()-200;//Screen.mainScreen.heightPixels-100;


		let height180AtZ=h*z;
		let heightAtZ=height180AtZ;

		if(h>w){
			//portrait mode shows 90deg
			height180AtZ*=2;
		}
		if(h<w){
			//landscape mode shows 60
			height180AtZ*=3;
		}

		let widthOf180AtZ=height180AtZ;

		

		this._markers0to180.setLayoutParams(new android.widget.FrameLayout.LayoutParams(widthOf180AtZ, heightAtZ));
		this._markers180to360.setLayoutParams(new android.widget.FrameLayout.LayoutParams(widthOf180AtZ, heightAtZ));

	}


	private _align180Containers(){


		let orientation=this._streetview.getOrientation();
		let bearing=orientation.bearing;

		let pixels180=this._markers0to180.getWidth();
		let pixelsPerDegree=pixels180/180.0;

		let horizontalCenter=Screen.mainScreen.widthPixels/2.0;

		let offset=horizontalCenter-(bearing*pixelsPerDegree);//(this._markers0to180.getLayoutParams().width/180)*bearing;
		

		this._markers0to180.setTranslationX(offset>-pixels180?offset:offset+2*pixels180);	
		this._markers180to360.setTranslationX(offset+((offset>0)?-1:1)*pixels180);



		let centerScreenY=this._markerLayer.getHeight()/2.0;
		let halfHeightContainer=this._markers0to180.getHeight()/2.0;

		let verticalCenterY=centerScreenY-halfHeightContainer;

		
		let tilt=orientation.tilt;
		let tiltPixels=tilt*pixelsPerDegree;

		
		this._markers0to180.setTranslationY(verticalCenterY+tiltPixels);
		this._markers180to360.setTranslationY(verticalCenterY+tiltPixels);



	}



	



	private _createMarkerView(marker, angle){

		let image=new android.widget.ImageView(this._streetview._context);
		image.setImageBitmap(marker.icon.imageSource.android);

		

		let ref = new WeakRef(this._streetview);
		let refMarker=new WeakRef(marker);

		image.setOnTouchListener(new android.view.View.OnTouchListener({
	        onTouch: function (view, event) {

	        	
	        	if (event.getActionMasked()==android.view.MotionEvent.ACTION_UP) {
            
		           	ref.get()._notifyMarkerTapped(refMarker.get());
		        	
		        }
		        return true;
	        },
	    }));


		return image;
	}









	private _initViews(){


		this._markerLayer = new android.widget.FrameLayout(this._streetview._context);
		this._markerLayer.setLayoutParams(new android.widget.FrameLayout.LayoutParams(
		                                     android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
		                                      android.widget.FrameLayout.LayoutParams.MATCH_PARENT));


		this._markerLayer.setClipChildren(false);
		this._markerLayer.setClipToPadding(false);

		this._streetview.nativeView.addView(this._markerLayer);

		this._markers0to180=this._makeView180();
		this._markers180to360=this._makeView180();

		//this._markers180to360.setBackgroundColor(android.graphics.Color.BLUE);


		this._label('0', this._markers0to180, 'bottom-left');
		this._label('180', this._markers0to180, 'top-right');
		this._label('180', this._markers180to360, 'bottom-left');
		this._label('360', this._markers180to360, 'top-right');



	}



	private _makeView180(){

		let view=new android.widget.RelativeLayout(this._streetview._context);

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


		let text=new android.widget.TextView(this._streetview._context);

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


}