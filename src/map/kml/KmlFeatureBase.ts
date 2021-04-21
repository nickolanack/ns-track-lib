export class KmlFeatureBase {



	resolveKml(kmlItem: string|any) {

		if (typeof kmlItem == 'function') {
			return kmlItem();
		}

		if (typeof kmlItem == 'string') {

			if (kmlItem.indexOf('.kml') > 0) {
				return new Promise((resolve, reject) => {

					(new (require('./KmlLoader').KmlLoader)()).fromPathOrUrl(path).then((kmlContent) => {

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


		return new Promise((resolve, reject) => {


			(new (require('./KmlLoader').KmlLoader)()).fromPathOrUrl(path).then((kmlContent) => {

				console.log("got kml string");
				resolve(kmlContent);
			}).catch((e) => {
				console.log("failed to render heatmap");
			});

		});

	}

}