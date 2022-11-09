import { distance, sigmondRolloff } from "../../../spatial/Spherical"
import {Screen} from "@nativescript/core"



export abstract class StreetViewMarkersBase{


	protected _streetview:any=null;
	protected _views:Array<any>=[];
	protected _markers:Array<any>=[];

	protected _queueMarker:any=null;


	// protected _closestMarker:any=null;
	// protected _closestD:number=Infinity;



	constructor(streetview){



		this._streetview=streetview;
		this._initViews();

	}


	abstract _initViews():void;
	abstract _setParent(image:any, parent:any):void;
	abstract _alignViewXYScale(image:any, x:number, y:number, zoom:number):void;
	abstract _createMarkerView(marker:any):any;
	abstract _alignView(view:any, x:number, y:number, w:number, h:number):void;

	abstract _updateIcon(marker:any, view:any):void;



	 _alignMarkerView(marker, image, horizontalDegrees, verticalDegrees, scale){
	 	//console.log(marker.userData.name+' '+horizontalDegrees);

		let pixelsPerDegree=this.pixelsPerDeg();
		let pixels180=pixelsPerDegree*180;
		let angleXPixels=horizontalDegrees*pixelsPerDegree;


		let angleYPixels=verticalDegrees*pixelsPerDegree;

		let containerRelativeXPixels=angleXPixels;
		if(angleXPixels<0){
			containerRelativeXPixels=pixels180-containerRelativeXPixels;
		}


		if(angleXPixels<0){
			this._setParent(image, this._markers180to360);
		}else{
			this._setParent(image, this._markers0to180);
		}



		let verticalCenter=Screen.mainScreen.heightPixels/2.0

		this._alignViewXYScale(image, containerRelativeXPixels, verticalCenter-angleYPixels, scale)


	}

	public hasMarkers(){
		return this._markers&&this._markers.length>0;
	}


	public updateMarkerIcon(marker){


		if(!(this._markers&&this._markers.indexOf(marker)>=0)){
			return marker;
		}

		let i =this._markers.indexOf(marker);
		if(this._views[i]){

			this._updateIcon(marker, this._views[i]);
		}

	}


	protected centerPos(){


		return {
			y:Screen.mainScreen.heightPixels/2.0,
			x:Screen.mainScreen.widthPixels/2.0
		}

	}


	protected pixelsPerDeg(){

		let h=Screen.mainScreen.heightPixels;
		let w=Screen.mainScreen.widthPixels;

		let scale=Screen.mainScreen.scale;

		var pixels180=scale*h/2;//1.5*h;

		if(w>h){
			pixels180=scale*h;//3*h;
		}

		let z=Math.pow(2, this._streetview.getOrientation().zoom);

		return (pixels180/180)*z;


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

		
		this._alignContainers();


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


	_alignContainers(){

		let orientation=this._streetview.getOrientation();
		let bearing=orientation.bearing;

		
		let pixelsPerDegree=this.pixelsPerDeg();
		let pixels180=pixelsPerDegree*180;

		let widthOf180AtZ=pixels180*180;
		let heightAtZ=Screen.mainScreen.heightPixels;


		let horizontalCenter=this.centerPos().x

		let offset=horizontalCenter-(bearing*pixelsPerDegree);//(this._markers0to180.getLayoutParams().width/180)*bearing;
		


		let centerScreenY=this.centerPos().y;
		let halfHeightContainer=heightAtZ/2.0;

		let verticalCenterY=centerScreenY-halfHeightContainer;

		
		let tilt=orientation.tilt;
		let tiltPixels=tilt*pixelsPerDegree;

		

		this._alignView(this._markers0to180, offset>-pixels180?offset:offset+2*pixels180, verticalCenterY+tiltPixels, widthOf180AtZ, heightAtZ);
		this._alignView(this._markers180to360, offset+((offset>0)?-1:1)*pixels180, verticalCenterY+tiltPixels, widthOf180AtZ, heightAtZ);


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



}