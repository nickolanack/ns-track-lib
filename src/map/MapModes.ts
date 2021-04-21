
export class MapModes {

	private _mode: any;
	private _modes: any = {};

	constructor() {




	}

	public isMode(mode) {
		return this._mode && (this._mode === mode || this._mode.split('|').indexOf(mode) >= 0);
	}

	public resetMode(mode) {
		this.clearMode(mode);
		this.setMode(mode);
	}
	public clearMode(mode) {
		if (!this.isMode(mode)) {
			return;
		}
		let modes = this._mode.split('|');
		modes.splice(modes.indexOf(mode), 1);
		this._mode = modes.join('');

		let clear = this._modes[mode][1];
		if (typeof clear == 'function') {
			clear();
		}

	}

	public setMode(mode) {

		if (this.isMode(mode)) {
			console.error('already in mode; ' + mode);
			return;
		}

		if (!this._modes[mode]) {
			throw 'Mode: ' + mode + ' is not defined';
		}


		this._mode = (this._mode || "").split('|').concat([mode]).join('|');
		let activate = this._modes[mode][0];
		if (typeof activate == 'function') {
			activate();
		}

		console.log(this._mode);

	}

	public addMode(mode, handler, cleanup) {
		if (this._modes[mode]) {
			throw 'Mode: ' + mode + ' is already defined';
		}

		this._modes[mode] = [handler, cleanup];
	}

}