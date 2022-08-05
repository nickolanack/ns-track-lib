
import {KmlFeatureBase} from "./KmlFeatureBase";
import {JsonFeature} from "../json/JsonFeature";
export class KmlFeature extends KmlFeatureBase {

	private _map: any;
	private _kml: string|any;
	private _jsonFeature: any;

	private _jsonData;
	private _items = null;

	constructor(map, kmlString) {
		super();
		this._map = map;
		this._kml = kmlString;

	
	}

	private _init() {

		return this.resolveKml(this._kml).then((kmlString) => {

			this._kml = null;

			const KmlReader=require('js-simplekml/KmlReader.js');
			const DOMParser=require('@xmldom/xmldom').DOMParser;


			this._jsonData=[];

			(new KmlReader(new DOMParser().parseFromString(kmlString)))
			  .parseMarkers((point)=>{    
			  		point.type="marker";  
			        this._jsonData.push(point)
			  }).parseLines((line)=>{
			        this._jsonData.push(line);       
			  }).parsePolygons((poly)=>{
			        this._jsonData.push(poly);        
			  }).parseNetworklinks((link)=>{
			                
			  }).parseGroundOverlays((overlay)=>{
			                
			  });

			  this._jsonFeature=new JsonFeature(this._map, this._jsonData);

		});

	}

	public hide() {

		if (!this._jsonFeature) {
			return this;
		}
		this._jsonFeature.hide();

		return this;
	}
	public show() {

		if (!this._jsonFeature) {
			this._init().then(() => {
				this.show();
			}).catch(console.error);
			
			return this;
		}

		this._jsonFeature.show();
		return this;
	}

}