
import { TileBounds } from "./TileBounds";

@NativeClass
class TileProvider extends com.google.android.gms.maps.model.UrlTileProvider {
	private _url: any;

	// constructor
	constructor(size) {
		super(size, size);
		// necessary when extending TypeScript constructors
		return global.__native(this);
	}

	setUrl(url) {
		this._url = url;
	}
	getTileUrl(x, y, z): java.net.URL {


		try {
			let url = this._url;
			if (typeof url == "function") {
				url = url(x, y, z);
			}
			url = url
				.replace('{x}', x)
				.replace('{y}', y)
				.replace('{z}', z)
				.replace('{time}', (new Date()).getTime());

			// console.log(url);
			return new java.net.URL(url);
		} catch (e) {
			console.error(e);
		}
		return null;
	}

}



export class TileFeature {

	private _tileOverlay: any;
	private _map: any;

	constructor(map, tile) {

		this._map = map;


		let tileBounds;
		if (tile.bounds) {
			tileBounds = new TileBounds(tile.bounds);
		}

		let size = tile.tileSize || 512;



		let tileProvider;


		if (tile.file) {
			tileProvider = new com.google.android.gms.maps.model.TileProvider({
				getTile(x, y, z) {

					if (tileBounds && (!tileBounds.contains(x, y, z))) {
						return com.google.android.gms.maps.model.TileProvider.NO_TILE;
					}


					try {
						let path = tile.file;
						let tileSize = tile.size || 256;
						if (typeof path == "function") {
							path = path(x, y, z);
						}
						path = path
							.replace('{x}', x)
							.replace('{y}', y)
							.replace('{z}', z)
							.replace('{time}', (new Date()).getTime());

						let file = new java.io.File(path);
						if (!file.exists()) {
							return com.google.android.gms.maps.model.TileProvider.NO_TILE;
						}
						let size = file.length();

						let bytes = Array.create("byte", size);

						let buf = new java.io.BufferedInputStream(new java.io.FileInputStream(file));
						buf.read(bytes, 0, size);
						buf.close();

						return new com.google.android.gms.maps.model.Tile(tileSize, tileSize, bytes);


					} catch (e) {
						console.error(e);
					}


					return com.google.android.gms.maps.model.TileProvider.NO_TILE;

				}


			});
		}

		if (tile.url) {
			tileProvider = new TileProvider(size);
			tileProvider.setUrl(tile.url);
		}

		if (tileBounds) {
			tileProvider.setBounds(tileBounds);
		}

		let tileOverlay = map.gMap.addTileOverlay(
			new com.google.android.gms.maps.model.TileOverlayOptions().tileProvider(tileProvider));


		tileOverlay.setTransparency(1 - (typeof tile.opacity == 'number' ? Math.max(0, Math.min(tile.opacity, 1)) : 1));

		this._tileOverlay = tileOverlay;

	}


	public setOpacity(opacity) {
		this._tileOverlay.setTransparency(1 - Math.max(0, Math.min(opacity, 1)));
		return this;
	}

	public hide() {
		this._tileOverlay.setVisible(false);
		return this;
	}
	public show() {
		this._tileOverlay.setVisible(true);
		return this;
	}


	public setZIndex(index) {
		this._tileOverlay.setZIndex(index);

	}

}