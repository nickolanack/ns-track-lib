
import { Marker, Position } from 'nativescript-google-maps-sdk';
import { ViewRenderer } from 'tns-mobile-data-collector/src/ViewRenderer';
import { extend, _isArray, _isObject, getConfiguration, requestPermissions } from 'tns-mobile-data-collector/src/utils';
import { Color, isAndroid, ImageSource, Image} from '@nativescript/core';

export class FeatureLoader{


	protected _renderer: any;


	constructor(options?){
		this._renderer = ViewRenderer.SharedInstance();
	}


	loadMarker(item){




		let me = this;


		if (item instanceof Marker) {
			return Promise.resolve(item);
		}

		return (new Promise(function(resolve, reject) {

			let marker = new Marker();


			marker.position = Position.positionFromLatLng(item.coordinates[0], item.coordinates[1]);
			marker.title = item.name;
			// marker.snippet = item.description;

			// if(item.coordinates.length==3){
			// 	marker._altitude=marker.coordinates[2];
			// }

			if (item.anchor) {
				marker.anchor = item.anchor;
			}


			if (typeof item.draggable == 'boolean') {
				marker.draggable = item.draggable;
			}

			//me._map.addMarker(marker);
			resolve(marker);



		})).then(function(marker: Marker) {


			return new Promise(function(resolve, reject) {


				let icon = me._renderer._parse(item.icon);
				if (_isArray(icon)) {
					icon = icon[isAndroid ? 1 : 0];
				}
				getConfiguration().getImage(icon, icon).then(function(iconPath) {

					// console.log("Render Feature: "+JSON.stringify(item, null, '   '));


					marker.userData = extend({
						icon: iconPath
					}, item);

					let image = new Image();

					image.imageSource = ImageSource.fromFileOrResourceSync(iconPath);
					marker.icon = image;
					resolve(marker);

				}).catch(function(err) {
					console.error(err);
					/**
					 * failed to parse icon
					 */
					marker.color = new Color('magenta');
					resolve(marker);

				});

			});

		}).then(function(marker: Marker) {
			return marker;
		}).catch((e)=>{
			console.error(e);
		});


	}




	public setIcon(marker: Marker, image) {



		if (image instanceof ImageSource) {
			return new Promise((resolve, reject) => {

				let img = new Image();
				img.imageSource = image;
				marker.icon = img;
				resolve(marker);

			});
		}




		let me = this;
		return new Promise(function(resolve) {
			let icon = me._renderer._parse(image);
			if (_isArray(icon)) {
				icon = icon[isAndroid ? 1 : 0];
			}
			getConfiguration().getImage(icon, icon).then(function(iconPath) {

				// console.log("Render Feature: "+JSON.stringify(item, null, '   '));


				let image = new Image();
				marker.userData.icon = image;
				image.imageSource = ImageSource.fromFileOrResourceSync(iconPath);
				marker.icon = image;
				resolve(marker);

			}).catch(console.error);
		});


	};



}