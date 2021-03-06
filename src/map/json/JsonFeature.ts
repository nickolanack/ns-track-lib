


export class JsonFeature {

	private _map;
	private _jsonData;
	private _items = null;


	public constructor(map, jsonData) {

		this._map = map;
		this._jsonData = jsonData;

	}


	public hide() {
		if (this._items) {
			this._items.forEach((item) => {
				if (item.shape == "polyline") {
					this._map.removeLine(item);
					return;
				}
				if (item.shape == "polygon") {
					this._map.removePolygon(item);
					return;
				}
				if ((!item.shape) || item.shape == "marker") {
					this._map.removeMarker(item);
					return;
				}

			});
		}
	}

	public show() {

		if (this._jsonData) {
			this._items = [];
			this._jsonData.forEach((item) => {
				if (item.type == "marker") {
					this._map.addMarker(item).then((marker) => {
						this._items.push(marker);
					});
				}

				if (item.type == "line") {
					this._map.addLine(item).then((line) => {
						this._items.push(line);
					});
				}

				if (item.type == "polygon") {
					this._map.addPolygon(item).then((polygon) => {
						this._items.push(polygon);
					});
				}

			});

			this._jsonData = null;
		}

		if (this._items) {
			this._items.forEach((item) => {
				if (item.shape == "polyline") {
					this._map.addLine(item);
					return;
				}
				if (item.shape == "polygon") {
					this._map.addPolygon(item);
					return;
				}
				if (item.shape == "marker") {
					this._map.addMarker(item);
					return;
				}

			});
		}


	}

	public static  ReadJson(path) {


		return new Promise((resolve, reject) => {


			(new (require('../kml/KmlLoader').KmlLoader)()).fromPathOrUrl(path).then((jsonContent) => {

				console.log("got json string");
				resolve(JSON.parse(jsonContent));
			}).catch((e) => {
				console.log("failed to read json");
			});

		});

	}

}