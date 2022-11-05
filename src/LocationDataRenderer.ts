
import {_isArray} from "tns-mobile-data-collector/src/utils";
import {isAndroid} from "@nativescript/core";
import {Permission} from "tns-mobile-data-collector/src/Permission";
import {Location} from "./Location";

import { requestPermission } from "nativescript-permissions";

declare var android:any;

export class LocationDataRenderer {

	private _renderer;

	public constructor() {

		let me = this;
		me._renderer = require('tns-mobile-data-collector').ViewRenderer.SharedInstance();


		console.log('add action: gps');
		Permission.AddActionSupported('gps', ()=>{

			return Promise.resolve(true);

		}, ()=>{
			return me.requireAccessToGPS();
		});

		Permission.AddPermission('location', ()=>{
			return me.requireAccessToLocation();
		});

		Permission.AddPermission('backgroundlocation', ()=>{
			return me.requireAccessToBackgroundLocation();
        });



		me._renderer.addViewType('location', function(container, field) {
			return me.renderLocation(container, field);
		});

		me._renderer.addFieldValidator('valid-coordinates', (value) => {
			return _isArray(value) && value.length >= 2 && (!(value[0] === 0 && value[1] === 0));
		});

	}


	public requireAccessToLocation() {


        if (isAndroid) {

             return requestPermission(android.Manifest.permission.ACCESS_FINE_LOCATION, "To show your location on the map").then(() => {
                 return {location: true};
             });
        }
        return new Promise((resolve) => {
            resolve({location: true});
        });

    }

    public requireAccessToBackgroundLocation() {


        if (isAndroid) {
             return requestPermission(android.Manifest.permission.ACCESS_BACKGROUND_LOCATION, "Track your route in the background").then(() => {
                 return {backgroundLocation: true};
             });
        }
        return new Promise((resolve) => {
            resolve({backgroundLocation: true});
        });

    }



    public requireAccessToGPS () {

        return new Promise((resolve, reject) => {

            console.log('Request GPS');

            let geolocation = require("@nativescript/geolocation");

            geolocation.enableLocationRequest().then(() => {

                console.log('Access To GPS Success');
                resolve({geolocation: geolocation});

            }).catch((e) => {

                console.log('Access To GPS Failed 1');
                console.error(e);
                // reject(e);
                geolocation.enableLocationRequest().then(() => {

                    console.log('Access To GPS Success');
                    resolve({geolocation: geolocation});

                }).catch((e) => {

                    console.error('Access To GPS Failed 2');
                    console.error(e);
                    reject(e);

                });

            });

        });


    }


	public renderLocation(container, field) {

		let me = this;

		let model = me._renderer.getModel();

		let current=model.get(field.name);

		if(!current){
			model.set(field.name, [0, 0]);
			current=[0,0];
		}


		let updateMode=field.updateMode||"follow";

		let validator = null;
		if (field.validator) {
			validator = me._renderer.addValidator(field, field.name);
			validator.validate(current);
		}

		let locationField=null;

		if (field.field) {

			let label=field.field;
			if(label===true){
				label={
					type:"label",
					value:"Your Location: {data."+field.name+".0|round(4)} {data."+field.name+".1|round(4)}"
				}
			}

			console.log('Render location field');
			locationField = me._renderer.renderField(container, label);
			if (validator) {
				validator.decorateElement(locationField);
			}

		}


		if(updateMode==="null"&&current){

			//does not watch;
			return locationField;
		}

		let location = new Location();
		location.watchLocation(function(loc) {

			

			console.log("Current location is: " + field.name + ": " + JSON.stringify(loc));
			let locationData = [loc.latitude, loc.longitude, loc.altitude, {
				"speed": loc.speed,
				"timestamp": loc.timestamp.getTime(),
				"direction": loc.direction,
				"accuracy": {
					"horizonal": loc.horizonalAccuracy,
					"vertical": loc.verticalAccuracy,

				}
			}];
			model.set(field.name, locationData);
			if (validator) {
				validator.validate(locationData);
			}

			if(updateMode=="null"||updateMode=="once"){
				location.clearWatch();
				location=null;
			}


		});

		me._renderer.onDisposeCurrent(function() {
			if(location){
				location.clearWatch();
			}
		});


		return locationField;

	}


}