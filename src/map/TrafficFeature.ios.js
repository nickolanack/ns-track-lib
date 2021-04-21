function TrafficFeature(map){

	this._map=map;


}


TrafficFeature.prototype.hide=function(){
	this._map.nativeView.trafficEnabled=false;
	return this;
}
TrafficFeature.prototype.show=function(){

	this._map.nativeView.trafficEnabled=true;
	return this;
}

module.exports=TrafficFeature;