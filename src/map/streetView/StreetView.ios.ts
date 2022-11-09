import { StreetViewBase } from "./StreetViewBase";
import { StreetViewMarkers } from "./overlay/StreetViewMarkers"

@NativeClass()
class PanoramaViewDelegateImpl extends NSObject implements GMSPanoramaViewDelegate {

    public static ObjCProtocols = [GMSPanoramaViewDelegate];

    private _owner: WeakRef<StreetView>;

    public static initWithOwner(owner: WeakRef<StreetView>): PanoramaViewDelegateImpl {
        let handler = <PanoramaViewDelegateImpl>PanoramaViewDelegateImpl.new();
        handler._owner = owner;
        return handler;
    }


    public panoramaViewDidMoveCamera(panorama:GMSPanoramaView, camera: GMSPanoramaCamera){


		let owner = this._owner.get();
		if (owner) {
			owner._panoramaViewDidMoveCamera(panorama, camera);
		}    	
    }

    public panoramaViewDidTapMarker(panorama:GMSPanoramaView, marker:GMSMarker){

    	let owner = this._owner.get();
		if (owner) {
			owner._panoramaViewDidTapMarker(panorama, marker);
		}  

    }

    public panoramaViewDidMoveToPanorama(panorama:GMSPanoramaView){
    	let owner = this._owner.get();
		if (owner) {
			owner._panoramaViewDidChange(panorama);
		} 
    }

 


}



export class StreetView extends StreetViewBase {

	protected _delegate: GMSPanoramaViewDelegate|null;


	public  setPanoId(id: string, callback?): Promise<void>{

		return new Promise((resolve) => {
			this.nativeView.moveToPanoramaID(id);
			resolve();
		});

	}


	public setCenter(pos: Array<number>, callback?): Promise<void> {

		return new Promise((resolve) => {
			this.nativeView.moveNearCoordinateRadius(CLLocationCoordinate2DMake(pos[0], pos[1]), 20);
			resolve();
		});


	}


	public setHeading(heading: number, callback?): Promise<void>{

		return new Promise((resolve) => {

			let duration=1000;


			let cameraOrientation=GMSPanoramaCamera.cameraWithHeadingPitchZoom(heading-this._headingAdjust, this.nativeView.camera.orientation.pitch ,this.nativeView.camera.zoom);
			this.nativeView.animateToCameraAnimationDuration(cameraOrientation, duration);

			resolve();
		}).catch((e)=>{
			console.error("failed to set heading");
			console.error(e);
		});


	}






	createNativeView() {

		const panoView = GMSPanoramaView.panoramaWithFrameNearCoordinateRadius(CGRectMake(0, 0, 600, 200), CLLocationCoordinate2DMake(45.3323676, 14.4551285), 20);
		panoView.camera = GMSPanoramaCamera.cameraWithHeadingPitchZoom(180 , -10 , 1);
		panoView.setAllGesturesEnabled(true);
		this.nativeView = panoView;
		return this.nativeView;

	}

	_panoramaViewDidChange(panorama:GMSPanoramaView){

		let coordinate=panorama.panorama.coordinate;
		let position={ latitude:coordinate.latitude, longitude:coordinate.longitude };

		if(JSON.stringify(this._lastPosition)!==JSON.stringify(position)){
			/**
			 * prevent too much logging
			 */
			//console.log(position);
			this._lastPosition=position;

			this.notify({
				eventName: 'positionChanged',
				object: this,
				position: position,
				type: "marker"
			});
		}

	}

	_panoramaViewDidMoveCamera(panorama:GMSPanoramaView, camera: GMSPanoramaCamera){

		let orientation={bearing:camera.orientation.heading, tilt:camera.orientation.pitch, zoom:camera.zoom-1};
		if(JSON.stringify(this._lastOrientation)!==JSON.stringify(orientation)){
			
			this.notifyAlign(orientation);
		}

	}

	_panoramaViewDidTapMarker(panorama:GMSPanoramaView, marker: GMSMarker){

		if(this._markers){
			var list=this._markers.filter((m)=>{
				return m.ios===marker;
			});

			if(list.length){
				this._notifyMarkerTapped(list[0]);
			}
		}

	}


	protected _showMarker(marker){
		//console.error('Not implemented!: StreetView.android.showMarker');


		if(!this._streetViewMarkers){
			this._streetViewMarkers=new StreetViewMarkers(this);
		}

		this._streetViewMarkers.add(marker);

		
	}


	// protected _showMarker(marker){

	// 	if(!this._markers){
	// 		this._markers=[];
	// 	}
	// 	marker.ios.panoramaView=this.nativeView;

	// 	if(this._markers.indexOf(marker)==-1){
	// 		this._markers.push(marker);
	// 	}


	// }




	initStreetView() {

		this._delegate = PanoramaViewDelegateImpl.initWithOwner(new WeakRef(this));
		this.nativeView.delegate = this._delegate;
		this.initPanorama();

	}

	initNativeView(): void {
		super.initNativeView();
		this.initStreetView();
	}

	onLoaded() {
        super.onLoaded();

    }

    onUnloaded() {
        super.onUnloaded();

      }


}