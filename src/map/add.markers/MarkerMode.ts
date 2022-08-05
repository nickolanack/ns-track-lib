import { MapBase as Map, MarkerEventData} from '../MapBase';
import { LocalLayerData } from '../LocalLayerData';
import { MapModes } from '../MapModes';
import { setCurrentPageData, extend } from 'tns-mobile-data-collector/src/utils';

export class MarkerMode {

	private _map: Map;
	private _modes: MapModes;
	private _currentMarker: any;
	private _localLayer: LocalLayerData;
	private _config: any;

	constructor(map: Map, layer: LocalLayerData, options?: any) {




		const me = this;
		this._map = map;
		this._modes = map.getMapModes();
		this._localLayer = layer;
		this._config = extend({
			defaultMarker: {}
		}, options || {});


		map.addAction('toggleDropMarker', () => {
			if (this._modes.isMode('marker')) {
				return;
			}
			this._modes.clearMode('line');
			this._modes.setMode('marker');
		});

		me._addMarkerTapActions();



		const _tapEvent = (event) => {


			if (!me._currentMarker) {

				map.addMarker(extend({
					'title': "Test",

					'coordinates': [event.position.latitude, event.position.longitude],
					"_id": (new Date()).getTime() + ".0"

				}, this._config.defaultMarker)).then((marker) => {
					me._currentMarker = marker;
					map.selectMarker(me._currentMarker);
				}).catch(console.error);



				return;
			}
			map.selectMarker(me._currentMarker);
			map.setPosition(me._currentMarker, [event.position.latitude, event.position.longitude]);

		};

		this._modes.addMode('marker', () => {
			setCurrentPageData('isDroppingMarker', true);
			map.on('coordinateLongPress', _tapEvent);

		}, () => {
			setCurrentPageData('isDroppingMarker', false);
			map.off('coordinateLongPress', _tapEvent);

		});



	}


	public _addMarkerTapActions() {

		const me = this;
		const map: Map = me._map;
		map.on("markerSelect", (event:MarkerEventData) => {
			const marker = event.marker;
			const buttons = [];

			if (marker === me._currentMarker) {


				map.getActionButtons().addSaveBtn(() => {

					this._localLayer.saveMarker(marker, () => {
						delete me._currentMarker;
					});


				});

				map.getActionButtons().addRemoveBtn(() => {


					map.removeMarker(marker);
					delete me._currentMarker;

				});


			}


			map.getActionButtons().show('marker');


		});


	}


}