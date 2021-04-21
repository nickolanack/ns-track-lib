import { ContentView } from "@nativescript/core";
import { getRenderer } from "../../utils";

export abstract class StreetViewBase extends ContentView {

	protected field: any;
	protected _renderer;

	public constructor(field?: any) {
		super();

		this.field = field;
		this._renderer = getRenderer();
	}

	public abstract setCenter(pos: Array<number>, callback?): Promise<void>;
	public abstract setHeading(heading: number, callback?): Promise<void>;

	notifyPanoramaReady() {


		if (this.field.center) {
			if (typeof this.field.center == 'string' && this.field.center[0] == '{') {
				this.field.center = this._renderer._parse(this.field.center);
			}
			this.setCenter(this.field.center);
			this.setHeading(this.field.heading||0);
			//this.setZoom(this.field.heading||0);
		}


	}

}