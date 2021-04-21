import {File} from "@nativescript/core";
import {TileBounds} from "./TileBounds";

import {getRenderer} from "../../utils";

export class TileFeature {

	private _tileOverlay: any;
	private _map: any;

	constructor(map, tile) {

		let tileBounds;
		if (tile.bounds) {
			tileBounds = new TileBounds(tile.bounds);
		}

		// Create the GMSTileLayer
		const tileOverlay = GMSURLTileLayer.tileLayerWithURLConstructor((x, y, z) => {


			if (tileBounds && (!tileBounds.contains(x, y, z))) {
				return null;
			}

			try {

				let url = tile.file || tile.url;
				if (typeof url == "function") {
					url = url(x, y, z);
				}

				url = url
					.replace('{x}', x)
					.replace('{y}', y)
					.replace('{z}', z)
					.replace('{time}', (new Date()).getTime());


				if (tile.file) {



					if (!File.exists(url)) {
						return null;
					}

					return NSURL.fileURLWithPath(url);
				}


				return NSURL.URLWithString(url);
			} catch (e) {
				console.error(e);
			}
			return null;
		});

		// Display on the map at a specific zIndex
		// tileLayer.zIndex = 100;
		tileOverlay.tileSize = 512;
		tileOverlay.opacity = typeof tile.opacity == 'number' ? Math.max(0, Math.min(tile.opacity, 1)) : 1.0;
		tileOverlay.map = map.nativeView;

		this._map = map;
		this._tileOverlay = tileOverlay;


	}
	public setOpacity = function(opacity) {
		this._tileOverlay.opacity = Math.max(0, Math.min(opacity, 1));
		return this;
	};

	public hide = function() {
		this._tileOverlay.map = null;
		return this;
	};
	public show = function() {

		this._tileOverlay.map = this._map.nativeView;
		return this;
	};

	public setZIndex(index) {
		this._tileOverlay.zIndex = index;

	}

}