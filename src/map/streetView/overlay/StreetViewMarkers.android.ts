import {StreetViewMarkersBase} from "./StreetViewMarkersBase"
import {Screen} from "@nativescript/core"



export class StreetViewMarkers extends StreetViewMarkersBase{

	

 	_initViews(){


		this._markerLayer = new android.widget.FrameLayout(this._streetview._context);
		this._markerLayer.setLayoutParams(new android.widget.FrameLayout.LayoutParams(
		                                     android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
		                                      android.widget.FrameLayout.LayoutParams.MATCH_PARENT));


		this._markerLayer.setClipChildren(false);
		this._markerLayer.setClipToPadding(false);

		this._streetview.nativeView.addView(this._markerLayer);

		this._markers0to180=this._makeView180();
		this._markers180to360=this._makeView180();


	}



	_updateIcon(marker, view){
		view.setImageBitmap(marker.icon.imageSource.android);
	}


	_setParent(image, parent){

		if(image.getParent()){
			return;
		}

		parent.addView(image);
		

		image.getLayoutParams().height = 48*Screen.mainScreen.scale;
		image.getLayoutParams().width  = 48*Screen.mainScreen.scale;


		image.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_TOP);
		image.getLayoutParams().addRule(android.widget.RelativeLayout.ALIGN_PARENT_LEFT);
	
	}


	_alignViewXYScale(image, x, y, scale){

		image.setTranslationX(x);
		image.setTranslationY(y);

		image.setScaleX(scale);
		image.setScaleY(scale);
		image.setZ(scale); //draw order;

	}


	_alignView(view, x, y, w, h){


		view.setLayoutParams(new android.widget.FrameLayout.LayoutParams(w, h));

		view.setTranslationX(x);
		view.setTranslationY(y);
	}

	



	 _createMarkerView(marker, angle){

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





	

	_makeView180(){

		let view=new android.widget.RelativeLayout(this._streetview._context);

		view.setLayoutParams(new android.widget.FrameLayout.LayoutParams(Screen.mainScreen.widthPixels*2, 500));


		view.setClipChildren(false);
		view.setClipToPadding(false);
	
		//view.setBackgroundColor(android.graphics.Color.parseColor("#70"+this._H()+this._H()+this._H()));
		
		this._markerLayer.addView(view);

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