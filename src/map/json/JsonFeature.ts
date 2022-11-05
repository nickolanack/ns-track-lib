


export class JsonFeature {

	private _map;
	private _jsonData;
	private _items = null;

	private _isVisible=false;

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

		this._isVisible=false;
	}

	public show() {

	

		if (this._jsonData) {
			
			this._jsonData.forEach((item) => {
				this._addObject(item);
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


		this._isVisible=true;

	}


	public hasBounds(){
		return true;
	}

	public getBounds(){

		return new Promise((resolve)=>{
			
			let north = -Infinity, south = Infinity, east = -Infinity, west = Infinity;

			const merge=(c)=>{


				north = Math.max(c.latitude, north);
				south = Math.min(c.latitude, south);

				east = Math.max(c.longitude, east);
				west = Math.min(c.longitude, west);



			}

			this._items.forEach((feature)=>{

				if (feature.shape == "polyline") {

					feature.getPoints().forEach((p)=>{

						merge(p);

					})

					return;
				}
				if (feature.shape == "polygon") {

					feature.getPoints().forEach((p)=>{

						merge(p);

					});

					return;
				}
				if (feature.shape == "marker") {

					merge(feature.getPosition());

					return;
				}

			});


			resolve({
				north:north,
				south:south,
				east:east,
				west:west
			});

		})

		


	}




	private _addObject(item){

		if(!this._items){
			this._items = [];
		}

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

	}

	public addObject(obj){
		if(this._isVisible){
			this._addObject(obj);
			return;
		}

		if(!this._jsonData){
			this._jsonData=[];
		}
		this._jsonData.push(obj);

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