export class KmlFeatureBase {



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


		return new Promise((resolve, reject) => {


			(new (require('./KmlLoader').KmlLoader)()).fromPathOrUrl(path).then((kmlContent) => {

				console.log("got kml string");
				resolve(kmlContent);
			}).catch((e) => {
				console.log("failed to render heatmap");
			});

		});

	}



	public static ReadKmlWorker(map, kmlString){

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


		})

	}

}