import { StreetViewMarkersBase } from "./StreetViewMarkersBase";
import {Screen, Color} from "@nativescript/core"

export class StreetViewMarkers extends StreetViewMarkersBase{



	 _initViews(){





		this._markerLayer =  UIView.alloc().initWithFrame(this._streetview.nativeView.frame);
		this._markerLayer.userInteractionEnabled=false;
		this._markerLayer.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;


		this._streetview.nativeView.addSubview(this._markerLayer);

		this._markers0to180=this._makeView180();
		this._markers180to360=this._makeView180();



	}


	_updateIcon(marker, view){
		view.image=marker.icon.imageSource.ios;
	}



	_makeView180(){

		let view=UIView.alloc().initWithFrame(CGRectMake(0,0,Screen.mainScreen.widthPixels*2,500));

	
		view.backgroundColor= (new Color(120, this._R(), this._R(), this._R())).ios;
		view.userInteractionEnabled=false;
		this._markerLayer.addSubview(view);
		return view;

	}


	

	_setParent(image, parent){

		if(image.superview){
			return;
		}
		parent.addSubview(image);
		
	}


	_alignViewXYScale(image, x, y, scale){

		let size=48*scale*Screen.mainScreen.scale;

		image.frame=CGRectMake(x-size/2.0, y+size, size, size);

	}

	




	_alignView(view, x, y, w, h){
		view.frame=CGRectMake( x, y, w, h);
	}

	



	 _createMarkerView(marker, angle){

		let image=UIImageView.alloc().init();
		image.frame=CGRectMake(0,0,48,48)
		image.image=marker.icon.imageSource.ios;


		return image;
	}



	private _R(){
		return Math.round(Math.random()*255);
	}








}