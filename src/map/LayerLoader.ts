


import { extend, _isArray, _isObject, getConfiguration, requestPermissions } from 'tns-mobile-data-collector/src/utils';
import { ViewRenderer } from 'tns-mobile-data-collector/src/ViewRenderer';
import { Layer } from './Layer';

export class LayerLoader{


	protected _options: any;
	protected _renderer: ViewRenderer;
	protected _map: any;
	protected _layers: Array<any>|string;
	protected _layerObjects: Array<any>;


	constructor(options){
		this._options=options;
		this._renderer = ViewRenderer.SharedInstance();
		this._layerObjects=[];
	}

	public setMap(map){
		this._map=map;
		return this;
	}


	public getLayers(){
		return this._layerObjects.slice(0);
	}

	public loadLayers(layers, callback) {





		this._layers=this._layers||layers||null;
		

		console.log('MapBase.loadLayers');


		if (!this._layers) {
			this._layers = this._options.layers || getConfiguration().get('layers', () => {

				let l = getConfiguration().get('layer', false);
				if (l !== false) {
					return [l];
				}
				return [];
			});


			if(typeof this._layers == "string" && this._renderer.getListViewRenderer().hasListResolver(this._layers)){

				this._renderer.getListViewRenderer()._listResolvers[this._layers]().then((list) =>{
					this._layers=list;
					this.loadLayers(this._layers, callback);
				}).catch(console.error);

				return;

			}

			if (typeof this._layers == "string" && this._layers.indexOf('{') === 0) {
				this._layers = this._renderer._parse(this._layers);
				if(typeof this._layers=='string'){
					
					console.log("Invalid layers string: "+this._layers);
					this._layers=[];
				}
			}

		}

		// console.log('Render Layers: '+JSON.stringify(layers));

		(<Array<any>>this._layers).forEach((l) => {

			if (typeof l == "string" && l.indexOf('{') === 0) {
				l = this._renderer._parse(l);
			}

			this._resolveLayer(l).then((list: Array<any>) => {

				console.log('MapBase.Add Layer');
				this._createLayer(extend({

				}, l)).then((layer: Layer) => {

					this._layerObjects.push(layer);

					layer.lazyLoad(() => {

						callback(layer, list.map((item) => {

							return this.formatItem(item);

						}));

					});

				}).catch((e) => {
					console.error("failed to resolve items: " + JSON.stringify(list));
					console.error(e);
				});

			}).catch((e) => {
				console.error("failed to resolve layer: " + JSON.stringify(l));
				console.error(e);
			});

		});


	}


	public _createLayer(item): Promise<Layer> {

		let me = this;

		return new Promise((resolve) => {

			let layer = new Layer(item, me._map);
			
			resolve(layer);

		});

	}



	public _resolveLayer(layer) {

		return new Promise((resolve, reject) => {

			if (_isObject(layer) && _isArray(layer.items)) {
				resolve(layer.items);
				return;
			}


			if (_isObject(layer) && (layer.type == "tile" || layer.type == "tileset" || layer.type == "kml" || layer.type == "traffic" || layer.type == "indoor" || layer.type == "buildings")) {


				layer = this.formatItem(layer);


				resolve([layer]);
				return;
			}


			if (typeof layer == 'string' || typeof layer == 'number' || _isObject(layer)) {
				// var args = [layer];
				this._renderer.getListViewRenderer()._listResolvers['layer'](layer).then(function(list) {
					resolve(list);
				}).catch(reject);
				return;

			}


			throw 'Unexpected layer type: ' + (typeof layer);
		});
	}


	protected formatItem(item) {


		(() => {


			/**
			 * add layer field formatters
			 */

			if (item.urlFormatter) {

				let url = item.url;

				if (typeof item.urlFormatter == 'string') {
					let urlFormater = this._renderer.getValueFormatter(item.urlFormatter);
					if (typeof urlFormater != 'function') {
						throw 'Expected tile.urlFormatter to be a function';
					}
					item.url = urlFormater(url);
					return;
				}

				if (typeof item.urlFormatter == 'function') {
					item.url = item.urlFormatter(url);
					return;
				}

				throw 'Unexpected tile.urlFormatter type. should be a function, or renderer defined function string';

			}
		})();

		return item;
	}



}