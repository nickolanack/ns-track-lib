
import { getConfiguration, extend } from "../../utils";
import { Observable, EventData, Connectivity} from "@nativescript/core";
import { TileDownloader } from "./TileDownloader";

interface InitEvent extends EventData {
	dataName: string;
}

interface Downloaders {
	[key: string]: TileDownloader;
}

export interface BoundsPoly {
	_id: string;
	coordinates: Array<Array<number>>;

}

export class OfflineTileDownloadManager extends Observable {


	private _postmessage: (msg: any) => void;
	private _dataName: string;

	private _tileDownloaders: Downloaders = {};
	private _isPaused: boolean = false;

	constructor(postmessage: (msg: any) => void) {

		super();
		this._postmessage = postmessage;



		this.on("initOfflineMap", (event: InitEvent) => {
			this._dataName = event.dataName;
			this._listBounds();
		});


		this.on("addOfflineBounds", (event: InitEvent) => {
			this._listBounds();
		});


		this.on("removeOfflineBounds", (event: InitEvent) => {
			this._listBounds();
		});


		Connectivity.startMonitoring((connection: number) => {
			this._onConnectionType(connection);
		});

		this._onConnectionType(Connectivity.getConnectionType());


	}


	private _onConnectionType(connection: number) {
		if (connection == Connectivity.connectionType.mobile) {
			if (this._useMobileData()) {
				this._resumeDownloads();
				return;
			}
			this._pauseDownloads();
			return;
		}

		if (connection == Connectivity.connectionType.bluetooth || connection == Connectivity.connectionType.ethernet || connection == Connectivity.connectionType.wifi) {
			this._resumeDownloads();
		}
	}

	private _useMobileData() {
		return false;
	}

	private _pauseDownloads() {
		if (this._isPaused) {
			return;
		}


		this._isPaused = true;
	}

	private _resumeDownloads() {
		if (!this._isPaused) {
			return;
		}

		this._isPaused = false;
	}

	public hasDownloaders() {
		return Object.keys(this._tileDownloaders).length > 0;
	}


	private _queueBounds(boundsPoly: BoundsPoly) {

		if (!this._tileDownloaders[boundsPoly._id]) {
			const downloader = new TileDownloader(boundsPoly);

			downloader.on('complete', (event) => {
				this.postMessage({
					eventName: "tileDownloadComplete",
					tileSetId: event.tileSetId,
					details: event.details
				});
			});

			this._tileDownloaders[boundsPoly._id] = downloader;
		}

	}


	private _listBounds() {

		this.postMessage({
			"eventName": "toast",
			"message": "Syncing offline tiles"
		});

		console.log("List Bounds: " + this._dataName);

		let local = getConfiguration().getLocalData(this._dataName, []).then((list: Array<BoundsPoly>) => {

			console.log("Bounds Features: " + JSON.stringify(list));

			list.forEach((item) => {
				this._queueBounds(item);
			});

			const ids = list.map((item) => {
				return item._id;
			});

			Object.keys(this._tileDownloaders).forEach((id) => {
				if (ids.indexOf(id) < 0) {
					this._tileDownloaders[id].cancel();
					delete this._tileDownloaders[id];
				}
			});

		}).catch((err) => {
			console.error("Bounds Error: " + err);
		});

	}

	private postMessage(msg) {
		this._postmessage(msg);
	}

	public onmessage(msg) {
		this.notify(extend({ object: this }, msg.data));
	}

}