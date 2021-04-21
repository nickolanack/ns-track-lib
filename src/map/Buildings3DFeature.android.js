function Buildings3DFeature(map){
	this._map=map;
}

Buildings3DFeature.prototype.hide=function(){
	this._map.gMap.setBuildingsEnabled(false);
	return this;
}

Buildings3DFeature.prototype.show=function(){

	this._map.gMap.setBuildingsEnabled(true);
	return this;
}

module.exports=Buildings3DFeature;