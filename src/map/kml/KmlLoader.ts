
import { knownFolders, File, Http } from "@nativescript/core";


export class KmlLoader {

	private _formatters: Array<any> = [];

	public addFormatter(fn) {

		this._formatters.push(fn);

		return this;
	}

	public fromPathOrUrl(path) {


		return new Promise((resolve, reject) => {

			if(path.indexOf('<')===0){
				resolve(path);
				return;
			}



			if (path.indexOf('://') > 0) {

				Http.getString(path).then(resolve).catch(reject);


				return;
			}


			console.log('read kml: ' + path);

			try {

				let file = knownFolders.currentApp().getFile('assets/' + path);

				if (!File.exists(file.path)) {
					console.error('read kml not exists: ' + file.path);
					return;
				}

				console.log('read kml: ' + file.path);

				let content = file.readTextSync((e) => {
					console.error('read error: ' + e);
				});
				// .then((content)=>{

				console.log('read kml: ' + content.length);

				resolve(content);

			} catch (e) {

				console.error('kml error: ' + e);
				reject(e);
				return;
			}

		});


	}


}

