
import {KmlFeatureBase} from "./KmlFeatureBase";
export class KmlFeature extends KmlFeatureBase {

	private _map: any;
	private _kml: string|any;
	private _parser: any;
	private _renderer: any;
	public ios: any = null;

	constructor(map, kmlString) {
		super();
		this._map = map;
		this._kml = kmlString;
	}

	private _init() {

		return this.resolveKml(this._kml).then((kmlString) => {

			this._kml = null;
			const parser = GMUKMLParser.alloc().initWithData(NSString.stringWithString(kmlString).dataUsingEncoding(NSUTF8StringEncoding));
			this._parser = parser;
			this._parser.parse();

		});

	}

	public hide() {

		if (!this._renderer) {
			return this;
		}
		this._renderer.clear();

		return this;
	}
	public show() {

		if (!this._parser) {
			this._init().then(() => {
				this.show();
			});
			return this;
		}

		const renderer = GMUGeometryRenderer.alloc().initWithMapGeometriesStyles(this._map.nativeView, this._parser.placemarks, this._parser.styles);
		renderer.render();
		this._renderer = renderer;
		this.ios = renderer;
		return this;
	}

}