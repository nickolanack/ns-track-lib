import {MapView} from 'nativescript-google-maps-sdk';
import { extend } from 'tns-mobile-data-collector/src/utils';
export class Layer {


	protected _map: MapView;
	protected config: any;
	protected _items: Array<any> = [];

	private _lazyLoad: any;

	constructor(options, map) {


		let me = this;
		me._map = map;
		me.config = extend({

			visible: true


		}, options);


		if (me.isVisible()) {
			// me.show();
		}

	}

	public getName (item) {
		let me = this;
		return me.config.name || "Unknown";
	}

	public getDescription (item) {
		let me = this;
		return me.config.description || "Unknown";
	}


	public isVisible () {
		let me = this;
		return me.config.visible;
	}

	public addItem (item, data) {
		let me = this;


		me._items.push(item);
		if (me.isVisible()) {
			me.showItem(item);
		} else {
			me.hideItem(item);
		}
		return me;
	}


	public getItemByFilter (fn) {
		let me = this;
		if (!me._items) {
			return null;
		}

		for (let i = 0; i < me._items.length; i++) {

			if (fn(me._items[i])) {
				return me._items[i] ;
			}

		}

		return null;
	}

	public showItem (i) {
		if (typeof i.show == 'function') {
			i.show();
			return;
		}


	}
	public hideItem (i) {
		if (typeof i.hide == 'function') {
			i.hide();
			return;
		}


	}



	public lazyLoad(fn) {
		this._lazyLoad = fn;

		if (this.isVisible()) {
			this._lazyLoad = null;
			setTimeout(function() {
				fn();
			}, 0);
		}

		return this;
	}

	public toggleVisibility () {

		let me = this;
		if (!me._items) {
			return me;
		}

		if (this._lazyLoad) {
			let fn = this._lazyLoad;
			this._lazyLoad = null;
			fn();
		}


		me._items.forEach((i) => {
			if (me.config.visible) {
				me.hideItem(i);
				return;
			}
			me.showItem(i);
			return;
		});

		me.config.visible = !me.config.visible;

		return me;

	}

}

