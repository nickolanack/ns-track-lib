function MapStyle(style, map){



	map.gMap.setMapStyle(new com.google.android.gms.maps.model.MapStyleOptions(JSON.stringify(style)));



}



module.exports = MapStyle;