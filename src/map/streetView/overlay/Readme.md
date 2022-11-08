# Overlay markers on google maps streetview with item tap interactions

Google Maps SDK for ios supports adding markers to a streetview:

```js
	//something like this pseudo-code
	~ marker.ios.panoramaView = pano; //GMSPanoramaView
```

For android a similar behavior can be added

```js

	//Init 
	const streetViewMarkers =new StreetViewMarkers(base:StreetViewBase);

	// call this in onStreetViewPanoramaCameraChange handler
	const onStreetViewPanoramaCameraChangeHandler=()=>{
	
		streetViewMarkers.alignMarkers();
	};



	//...


	// ...forEach((marker)=>{

		streetViewMarkers.add(marker);

	//}...


	



	// Additional features:
	


	// update the image displayed on streetview for a given marker
	streetViewMarkers.updateMarkerIcon(someMarker) 


```