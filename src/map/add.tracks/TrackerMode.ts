import { MapBase as Map } from '../MapBase';
import { LocalLayerData } from '../LocalLayerData';
import { MapModes } from '../MapModes';
import { setCurrentPageData, extend } from '../../utils';

import { Observable } from "@nativescript/core";

import {LineDecorator} from '../LineDecorator';
import {Polyline} from 'nativescript-google-maps-sdk';
import {Location} from '../../Location';
import {distance} from '../../spatial/Spherical';

export class TrackerMode extends Observable {

	private _map: Map;
	private _modes: MapModes;
	private _localLayer: LocalLayerData;
	private _config: any;


	// private _isDragging:boolean=false;
	private _currentLineEdit: any;
	private _currentLine: any;
	private _currentLineTracker: any;
	private _currentTrack: Polyline;
	private _currentTrackPoints: Array<any> = [];
	private _backgroundTracking: any;

	constructor(map: Map, layer: LocalLayerData, options?: any) {

		super();


		const me = this;
		this._map = map;
		this._modes = map.getMapModes();
		this._localLayer = layer;
		this._config = extend({
			lineEditorOptions: {},
			lineTrackerOptions: {}
		}, options || {});




		let location = new Location();


		map.addAction('toggleTracking', () => {

			if (this._modes.isMode('track')) {
				this._modes.clearMode('track');
				return;
			}
			this._modes.setMode('track');
		});

		if (!me._backgroundTracking) {
			me._backgroundTracking = new (require('../BackgroundMapLocation'))();
		}
		me._backgroundTracking.disable();


		this._modes.addMode('track', () => {



			setCurrentPageData('isTracking', true);


			let mytrack = {
				startTime: new Date().getTime(),
				distance: 0,
				segments: 0,
				minAlt: Infinity,
				maxAlt: -Infinity,
				deltaAlt: 0
			};
			setCurrentPageData('mytrack', mytrack);

			me._backgroundTracking.enable();


			const _addPointToTrack = (loc) => {
				if (me._currentTrack) {

					console.log('got location: ' + JSON.stringify([loc[0], loc[1]]));

					mytrack.minAlt = Math.min(mytrack.minAlt, loc[2]);
					mytrack.maxAlt = Math.max(mytrack.maxAlt, loc[2]);
					mytrack.deltaAlt = mytrack.maxAlt - mytrack.minAlt;



					mytrack.distance += distance(me._currentTrack.userData.coordinates.slice(-1).pop(), [loc[0], loc[1]]);

					me._currentLineTracker.addPoint(loc);


					mytrack.segments++;
					setCurrentPageData('mytrack', mytrack);


					return;
				}
				map.addLine(extend(me._config.defaultTrack, {
					'title': "Test",
					'coordinates': [loc]
				})).then((line: Polyline) => {
					me._currentTrack = line;
					me._addLineTracker();
				});

			};


			location.watchLocation((loc) => {

				_addPointToTrack(
					[loc.latitude, loc.longitude, loc.altitude, {
						"speed": loc.speed,
						"timestamp": loc.timestamp.getTime(),
						"direction": loc.direction,
						"accuracy": {
							"horizonal": loc.horizontalAccuracy,
							"vertical": loc.verticalAccuracy,

						}
					}]
				);

			}, {
				iosAllowsBackgroundLocationUpdates: true
			});

		}, () => {
			setCurrentPageData('isTracking', false);
			location.clearWatch();


			// map.getActionButtons().clearActions();
			// if (this._modes.isMode('line')) {
			// 	this._modes.resetMode('line');
			// } else {
			// 	this._modes.clearMode('marker');
			// 	this._modes.setMode('line');
			// }

			// me._currentLine = me._currentTrack;
			// me._addLineEditor();


			const track = me._currentTrack;

			if (track.getPoints().length > 1) {
				me._localLayer.saveLine(track, (err) => {

					if (err) {
						return;
					}

					track.clickable = true;

					me.notify({
						eventName: "complete",
						object: track
					});
				});
			}


			me._currentLineTracker.remove();
			delete me._currentLineTracker;
			me._backgroundTracking.disable();

			me._currentTrack = null;
		});





	}


	public _addLineEditor() {

		let me = this;
		me._currentLineEdit = new LineDecorator(me._map, me._currentLine, extend({}, this._config.lineEditorOptions));


		me.notify({
			eventName: "addLineEditor",
			object: me._currentLineEdit
		});
	}


	public _addLineTracker() {

		let me = this;
		me._currentLineTracker = new LineDecorator(me._map, me._currentTrack, extend({}, this._config.lineTrackerOptions));


		me.notify({
			eventName: "addLineTracker",
			object: me._currentLineTracker
		});
	}

}