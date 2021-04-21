
import {MapBase} from './MapBase';

export class Map extends MapBase {



	public getBoundsPoly() {

		const vis = this._map.gMap.getProjection().getVisibleRegion();

		return ([vis.farLeft, vis.farRight, vis.nearRight, vis.nearLeft]).map((value) => {
			return [value.latitude, value.longitude];
		});


	}

	public getCenter(): Array<number> {
		let target = this._map.gMap.getCameraPosition().target;
		return [target.latitude, target.longitude];
	}

	public setCenter(pos: Array<number>, callback?): Promise<void> {
		return new Promise((resolve, reject) => {

			const currentPos = this._map.gMap.getCameraPosition();
			// const currentZoom=this.getZoom();
			const position = (new com.google.android.gms.maps.model.CameraPosition.Builder(currentPos)).target(new com.google.android.gms.maps.model.LatLng(pos[0], pos[1])).build();
			const update = com.google.android.gms.maps.CameraUpdateFactory.newCameraPosition(position);
			this._map.gMap.animateCamera(update,  350, new com.google.android.gms.maps.GoogleMap.CancelableCallback({
				onCancel: () => {
					reject('cancelled');
				},
				onFinish: () => {
					if (callback) {
						callback();
					}
					resolve();
				}
			}));

		});
	}

	public setZoomAndCenter(zoom: number, pos: Array<number>, callback?): Promise<void> {


		return new Promise((resolve, reject) => {

			const currentPos = this._map.gMap.getCameraPosition();
			// const currentZoom=this.getZoom();
			const position = (new com.google.android.gms.maps.model.CameraPosition.Builder(currentPos)).zoom(zoom).target(new com.google.android.gms.maps.model.LatLng(pos[0], pos[1])).build();
			const update = com.google.android.gms.maps.CameraUpdateFactory.newCameraPosition(position);
			this._map.gMap.animateCamera(update,  350, new com.google.android.gms.maps.GoogleMap.CancelableCallback({
				onCancel: () => {
					reject('cancelled');
				},
				onFinish: () => {
					if (callback) {
						callback();
					}
					resolve();
				}
			}));

		});



	}


	public getZoom(): number {
		return this._map.gMap.getCameraPosition().zoom;
	}
	public setZoom(zoom: number, callback?): Promise<void> {

		return new Promise((resolve, reject) => {

			const currentPos = this._map.gMap.getCameraPosition();
			// const currentZoom=this.getZoom();
			const position = (new com.google.android.gms.maps.model.CameraPosition.Builder(currentPos)).zoom(zoom).build();
			const update = com.google.android.gms.maps.CameraUpdateFactory.newCameraPosition(position);
			this._map.gMap.animateCamera(update,  350, new com.google.android.gms.maps.GoogleMap.CancelableCallback({
				onCancel: () => {
					reject('cancelled');
				},
				onFinish: () => {
					if (callback) {
						callback();
					}
					resolve();
				}
			}));

		});
	}

	public setMapTypeNone() {
		this._map.gMap.setMapType(com.google.android.gms.maps.GoogleMap["MAP_TYPE_NONE"]);
		this.notify({
			eventName: 'setMapType',
			object: this,
			type: "none"
		});
	}

	public setMapType (type) {
		let me = this;
		let types = ["normal", "satellite", "hybrid", "terrain"];
		if (types.indexOf(type) >= 0) {


			me._type = type;

			me._map.gMap.setMapType(com.google.android.gms.maps.GoogleMap[(["MAP_TYPE_NORMAL", "MAP_TYPE_SATELLITE", "MAP_TYPE_HYBRID", "MAP_TYPE_TERRAIN"])[types.indexOf(type)]]);


			me.notify({
				eventName: 'setMapType',
				object: me,
				type: type
			});

		}

	}


}