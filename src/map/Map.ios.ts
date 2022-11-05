
import { MapBase } from './MapBase';

export class Map extends MapBase {


	constructor(map, options) {
		super(map, options);

		map.on("myLocationTapped", function(event) {

			try {

			event.object.nativeView.animateToLocation(event.object.nativeView.myLocation.coordinate);
			if (event.object.zoom <= 2) {
				event.object.nativeView.animateToZoom(event.object.nativeView.maxZoom - 3);
			}

			} catch (e) {
				console.error("My Location Click Error");
				console.error(e);
			}
		});
	}


	public getBoundsPoly() {

		const vis = <GMSVisibleRegion>(<GMSMapView>this._map.nativeView).projection.visibleRegion();

		return ([vis.farLeft, vis.farRight, vis.nearRight, vis.nearLeft]).map((value: CLLocationCoordinate2D) => {
			return [value.latitude, value.longitude];
		});


	}


	





	public getCenter(): Array<number> {
		let target: CLLocationCoordinate2D = this._map.gMap.camera.target;
		return [target.latitude, target.longitude];
	}

	public setCenter(pos: Array<number>, callback?): Promise<void> {
		return new Promise((resolve, reject) => {

			const update = GMSCameraUpdate.setTarget(CLLocationCoordinate2DMake(pos[0], pos[1]));
			this.once('cameraChanged', () => {
				if (callback) {
					callback();
				}
				resolve();
			});
			(<GMSMapView>this._map.nativeView).animateWithCameraUpdate(update);
		});
	}

	public setZoomAndCenter(zoom: number, pos: Array<number>, callback?): Promise<void> {

			return new Promise((resolve, reject) => {

			const update = GMSCameraUpdate.setTargetZoom(CLLocationCoordinate2DMake(pos[0], pos[1]), zoom);
			this.once('cameraChanged', () => {
				if (callback) {
					callback();
				}
				resolve();
			});
			(<GMSMapView>this._map.nativeView).animateWithCameraUpdate(update);
		});



	}




	public getZoom(): number {
		return this._map.gMap.camera.zoom;
	}


	public setZoom(zoom, callback?): Promise<void> {

		return new Promise((resolve, reject) => {

			const update = GMSCameraUpdate.zoomTo(zoom);
			this.once('cameraChanged', () => {
				if (callback) {
					callback();
				}
				resolve();
			});
			(<GMSMapView>this._map.nativeView).animateWithCameraUpdate(update);
		});
	}

	public setMapTypeNone() {
		this._map.nativeView.mapType = kGMSTypeNone;
		this.notify({
			eventName: 'setMapType',
			object: this,
			type: "none"
		});
	}

	public setMapType = function(type) {
		let me = this;
		let types = ["normal", "satellite", "hybrid", "terrain"];
		if (types.indexOf(type) >= 0) {


			me._type = type;


			me._map.nativeView.mapType = ([kGMSTypeNormal, kGMSTypeSatellite, kGMSTypeHybrid, kGMSTypeTerrain])[types.indexOf(type)];



			me.notify({
				eventName: 'setMapType',
				object: me,
				type: type
			});

		}

	};

}