import { distance, sigmondRolloff } from "../../../spatial/Spherical"

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
	abstract _alignMarkerView(marker:any, image:any, horizontalDegrees:number, verticalDegrees:number, scale:number):void;
	abstract _createMarkerView(marker:any):any;
	abstract _alignContainers():void;

	public hasMarkers(){
		return this._markers&&this._markers.length>0;
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