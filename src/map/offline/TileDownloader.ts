import { BoundsPoly } from './OfflineTileDownloadManager';
import { Observable,  File, knownFolders, path, Http  } from "@nativescript/core";

import { _isArray } from "../../utils";


import {coordinateBounds, latToY, lngToX} from '../tile/TileBounds';

interface Bounds {
	north: number;
	south: number;
	east: number;
	west: number;
}


interface Details {
	bounds: Bounds;
	zoomRange: [number, number];
	countTiles: number;
	downloaded: number;
	downloadedSize: number;
	totalSizeEstimateMB?: number;
	totalSizeMB?: number;
	folder: string;
	tilePath: string;
}

const HybridMapTileUrl = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";

export class TileDownloader extends Observable {

	private _boundsPoly: BoundsPoly;
	private _bounds: Bounds;
	private _zoomRange: [number, number];
	private _countTiles: number;
	private _sizeEstimateMB: number;
	private _downloaded: number = 0;
	private _downloadedSizeB: number = 0;
	private _currentTile;
	private _folder;

	constructor(boundsPoly: BoundsPoly) {

		super();
		this._boundsPoly = boundsPoly;


		this.delay(() => {

			this.calculateTileDetails();
			this.notify({
				eventName: "tileDetails",
				object: this,
				tileSetId: boundsPoly._id,
				details: this.getDetails()

			});

			this.delay(() => {

				this.iterateAsync((x, y, z) => {
					return new Promise((resolve, reject) => {

						// console.log({x:x,y:y,z:z});
						// if (z >= 16) {
						// 	reject('Exited at: ' + JSON.stringify({ x: x, y: y, z: z }));
						// 	return; //false;
						// }





						let file: string = this.getPath(x, y, z);
						let url: string = this.getUrl(x, y, z);

						// console.log(file);
						// console.log(url);



						if (File.exists(file)) {
							this._downloaded++;
							this._downloadedSizeB += File.fromPath(file).size;
							resolve(true);
							return;
						}


						this._currentTile = { x: x, y: y, z: z };
						Http.getFile(url, file).then((file) => {




							this._downloaded++;
							this._downloadedSizeB += file.size;

							resolve(true);
						}).catch(console.error);


						// reject('Need Tile: '+JSON.stringify({x:x,y:y,z:z})+" @: "+url);
						// reject();



					});

				}).then(() => {



					this.notify({
						eventName: "complete",
						object: this,
						tileSetId: boundsPoly._id,
						details: this.getDetails()
					});

				}).catch(console.error).finally(() => {

					console.log("downloaded: " + this._downloaded);
					console.log("downloaded size MB: " + this._downloadedSizeB / (1024 * 1024));
					console.log("average size KB: " + (this._downloadedSizeB / 1024) / this._downloaded);

				});

			});

		});


	}

	private getPath(x, y, z): string {

		return path.join(this._folder, z + '', x + '', y + ".jpeg");

	}

	private getUrl(x, y, z): string {


		return HybridMapTileUrl
			.replace('{x}', x)
			.replace('{y}', y)
			.replace('{z}', z);



	}

	/**
	 * iterates the set of tiles [[x,y,z]...] at each zoom level, x, and y.
	 * this method will run asyncronously so if `fn` can return a promise
	 * and execution will not proceed until it resolves. so that heavy processes
	 * can take advantage of file/network io etc
	 *
	 * if fn promise rejects then execution is halted. if not using promises simply
	 * return false to halt execution
	 *
	 * @param {Function} fn [description]
	 */
	private iterateAsync(fn): Promise {




		return this.iterateValues(this._zoomRange[0], this._zoomRange[1], (z) => {


			let range = this.getTileRangeAt(this._bounds, z);

			return this.iterateValues(range.x[0], range.x[1], (x) => {

				return this.iterateValues(range.y[0], range.y[1], (y) => {
					return fn(x, y, z);
				});

			});

		});





	}


	private iterateValues(a, b, fn) {

		const zooms = [];



		let promise = Promise.resolve();

		for (let i = a; i <= b; i++) {

			promise = promise.then(() => {
				let result = fn(i);
				if (result === false) {
					throw 'Stopping on false';
				}
				return result;
			});

		}

		return promise;

	}

	private delay(fn) {
		setTimeout(fn, 1000 + Math.random() * 4000);
	}

	private getDetails(): Details {
		const details: Details = {
			bounds: this._bounds,
			zoomRange: this._zoomRange,
			countTiles: this._countTiles,
			downloaded: this._downloaded,
			downloadedSize: this._downloadedSizeB,
			folder: this._folder,
			tilePath: this.getPath('{x}', '{y}', '{z}')
		};

		if (this._downloaded < this._countTiles) {
			if (this._downloaded > 0) {
				this._sizeEstimateMB = ((this._downloadedSizeB / this._downloaded) * this._countTiles) / (1024 * 1024);
			}
			details.totalSizeEstimateMB = this._sizeEstimateMB;
		}



		if (this._downloaded == this._countTiles) {
			details.totalSizeMB = this._downloadedSizeB / (1024 * 1024);
		}



		return details;




	}

	private calculateTileDetails() {



		const bounds = this.getBounds();
		this._bounds = bounds;
		console.log(bounds);

		let zMin = this.calculateFitZoom(bounds);
		zMin =  Math.max(0, zMin - 2);
		let zMax = Math.min(17, zMin + 8);
		this._zoomRange = [0, zMax];



		let numTiles = this.countTiles(bounds, zMin, zMax);
		this._countTiles = numTiles;

		let mbytes = (20 * numTiles) / 1024;
		this._sizeEstimateMB = mbytes;
		console.log(mbytes + 'MB');


		let folder = knownFolders.temp();
		this._folder = path.join(folder.path, 'gmap_hybrid_tileset_' + this._boundsPoly._id);

		console.log("folder: " + this._folder);

	}

	private countTiles(bounds, zStart, zEnd) {

		let counter = 0;
		for (let z = zStart; z <= zEnd; z++) {

			let range = this.getTileRangeAt(bounds, z);
			let sum = (1 + range.x[1] - range.x[0]) * (1 + range.y[1] - range.y[0]);
			console.log(z + ":" + JSON.stringify(range) + " = " + sum);

			counter += sum;


		}

		return counter;

	}

	private getTileRangeAt(bounds: Bounds, z: number) {


		return {

			x: ([this.lngToX(bounds.west, z), this.lngToX(bounds.east, z)]).sort(),
			y: ([this.latToY(bounds.south, z), this.latToY(bounds.north, z)]).sort()
		};

	}

	private calculateFitZoom(bounds: Bounds) {




		let minZ = 0;


		let z = minZ;
		while (z < 10) {

			let range = this.getTileRangeAt(bounds, z);
			if (range.x[1] - range.x[0] > 1) {
				return z - 1;
			}

			if (range.y[1] - range.y[0] > 1) {
				return z - 1;
			}


			z++;
		}


		return z;


	}

	private getBounds(): Bounds {
		return coordinateBounds(this._boundsPoly.coordinates);
	}


	private lngToX(lng, zoom) {
		return lngToX(lng, zoom, 256);
	}

	private latToY(lat, zoom) {

		return latToY(lat, zoom, 256);

	}




	public cancel() { }

}