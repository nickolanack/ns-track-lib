

interface TimeOffsetTileset {
	url: string;
	timeOffsets: Array<number>;
}

interface Tileset {
	url?: string;
	timeOffsets?: Array<number>;
	tiles: Array<TileOptions>;
	timeout?: number;
	opacity?: number;
}

interface TileOptions {
	url: string;
}

export class TilesetFeature {


	private _tileSet: Array<any> = [];
	private _config: Tileset;
	private _interval: any;

	constructor(map, tile: TimeOffsetTileset|Tileset) {



		if (tile["timeOffsets"] && tile["url"]) {
			tile["tiles"] = (<TimeOffsetTileset>tile).timeOffsets.map((offset) => {

				return {
					url: () => {
						return (<TimeOffsetTileset>tile).url.replace('{time}', "" + ((new Date()).getTime() + offset * 1000));
					}
				};

			});

		}

		this._config = <Tileset>tile;

		(<Tileset>tile).tiles.forEach((t) => {
			this._tileSet.push(new (require('./TileFeature').TileFeature)(map, t));
		});


	}

	public hide() {
		this._tileSet.forEach((t) => {
			t.hide();
		});
		clearInterval(this._interval);
		return this;
	}
	public show() {

		let counter = 0;
		if (this._tileSet.length > 0) {
			this._tileSet[0].show();
		}

		this._interval = setInterval(() => {

			if (this._tileSet.length < 2) {
				return;
			}

			this._tileSet[counter].setOpacity(0);
			counter = (counter + 1) % this._tileSet.length;
			this._tileSet[counter].setOpacity(this._config.opacity || 1);

		}, this._config.timeout || 1000);

		return this;
	}


}