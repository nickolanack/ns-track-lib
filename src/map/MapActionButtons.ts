
import { Observable } from "@nativescript/core";

import { getRenderer } from 'tns-mobile-data-collector/src/utils';

export class MapActionButtons extends Observable {

	private _fieldset: any;
	private _container: any;
	private _content: any;
	private _buttons: Array<any> = [];
	private _iconPath: string = '~/markers/';

	constructor(container) {

		super();

		let me = this;
		me._container = container;

		if (!me._fieldset) {

			me._fieldset = getRenderer().renderField(me._container, {
				"type": "fieldset",
				"position": "absolute",
				"top": 10,
				"right": 10,
				"fields": []
			});
		}




	}


	private _clr(fn: (...args: Array<any>) => void) {


		return (...args: Array<any>) => {
			fn.apply(null, args);
			this.clearActions();
		};
	}

	public clearActions() {
		let me = this;

		if (me._content) {
			me._fieldset.removeChild(me._content);
			delete me._content;
		}

	}


	public setActions(name, buttons) {
		let me = this;
		me.clearActions();


		me._content = getRenderer().renderField(me._fieldset, {
			"type": "fieldset",
			"fields": buttons
		});

	}


	public setIconPath(path) {
		this._iconPath = path;
		return this;
	}

	public addRemoveBtn(fn) {

		this._buttons.push({
			"type": "icon",
			"orientation": "vertical",
			"icon": this._iconPath + "remove.png",
			"className": "map-control remove",
			"action": this._clr(fn)
		});
	}

	public addRemoveVertBtn(fn) {


		this._buttons.push({
			"type": "icon",
			"orientation": "vertical",
			"icon": this._iconPath + "remove-vert.png",
			"className": "map-control remove vertex",
			"action": this._clr(fn)
		});

	}

	public addEditBtn(fn) {


		this._buttons.push({
			"type": "icon",
			"orientation": "vertical",
			"icon": this._iconPath + "edit.png",
			"className": "map-control edit",
			"action": this._clr(fn)
		});

	}

	public addSaveBtn(fn) {


		this._buttons.push({
			"type": "icon",
			"orientation": "vertical",
			"icon": this._iconPath + "checkmark.png",
			"className": "map-control save",
			"action": this._clr(fn)
		});

	}

	public show(name) {

		if (this._buttons.length == 0) {
			return this;
		}

		this.setActions(name, this._buttons);
		this._buttons = [];
		return this;
	}

}


