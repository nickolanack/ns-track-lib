function MapStyle(style, map){



	map.nativeView.mapStyle=GMSMapStyle.styleWithJSONStringError(JSON.stringify(style), null);


}



module.exports = MapStyle;