function TrafficFeature(map){

	this._map=map;


}


TrafficFeature.prototype.hide=function(){
	this._map.gMap.setTrafficEnabled(false);
	return this;
}
TrafficFeature.prototype.show=function(){

	this._map.gMap.setTrafficEnabled(true);
	return this;
}

module.exports=TrafficFeature;