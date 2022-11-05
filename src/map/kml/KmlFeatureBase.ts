
import{ Observable } from '@nativescript/core';

export class KmlFeatureBase extends Observable{

	protected static _pathResolver:any=null;

	resolveKml(kmlItem: string|any) {

		if (typeof kmlItem == 'function') {
			return kmlItem();
		}

		if (typeof kmlItem == 'string') {

			if (kmlItem.indexOf('.kml') > 0&&kmlItem[0]!='<') {
				return new Promise((resolve, reject) => {

					(new (require('./KmlLoader').KmlLoader)()).fromPathOrUrl(kmlItem).then((kmlContent) => {

						console.log("got kml string");
						resolve(kmlContent);
					}).catch((e) => {
						console.log("failed to render heatmap");
					});

				});
			}

			return Promise.resolve(kmlItem);
		}


		throw 'Invalid kml item: ' + (typeof kmlItem);
	}



	public static  ReadKml(path) {

		if(typeof path=='function'){
			return path();
		}


		KmlFeatureBase._ResolvePath(path).then((path)=>{

			return new Promise((resolve, reject) => {


				(new (require('./KmlLoader').KmlLoader)()).fromPathOrUrl(path).then((kmlContent) => {

					console.log("got kml string");
					resolve(kmlContent);
				}).catch((e) => {
					console.log("failed to render heatmap");
				});

			});

		})


		

	}

	private static  _ResolvePath(path){


		if(KmlFeatureBase._pathResolver){
			return KmlFeatureBase._pathResolver(path);
		}

		return Promise.resolve(path);

	}


	public static SetPathResolver(fn){

		KmlFeatureBase._pathResolver=fn;

	}


	public static ReadKmlWorker(map, kmlString){


		return KmlFeatureBase._ResolvePath(kmlString).then((kmlString)=>{

			return new Promise((resolve, reject)=>{


				const JsonFeature = require('../json/JsonFeature').JsonFeature;
				let feature=new JsonFeature(map, []);


				var worker = new Worker("./KmlJsonWorker.js");

				// send a message to our worker
				worker.postMessage(kmlString);

				// receive a message from our worker
				worker.onmessage = function(msg) {
					feature.addObject(msg.data);
				}

				worker.onerror = function(e) {
				    console.log("Worker thread error: " + e);
				}


				resolve(feature);


			});

		});

	}





}