import { MapBase as Map, ShapeEventData, MarkerEventData} from '../MapBase';
import { LocalLayerData } from '../LocalLayerData';
import { MapModes } from '../MapModes';

import { setCurrentPageData, extend } from 'tns-mobile-data-collector/src/utils';

import { Observable } from "@nativescript/core";

import {LineDecorator} from '../LineDecorator';

export class LineMode extends Observable {

	private _map: Map;
	private _modes: MapModes;
	private _localLayer: LocalLayerData;
	private _config: any;

	private _isDragging: boolean = false;
	private _currentLineEdit: any;
	private _currentLine: any;

	constructor(map: Map, layer: LocalLayerData, options?: any) {

		super();


		const me = this;
		this._map = map;
		this._modes = map.getMapModes();
		this._localLayer = layer;
		this._config = extend({
			lineEditorOptions: {}
		}, options || {});


		map.on("markerBeginDragging", (event) => {
			me._isDragging = true;
		});
		map.on("markerEndDragging", (event) => {
			me._isDragging = false;
		});


		map.addAction('toggleDrawLine', () => {
			if (this._modes.isMode('line')) {
				this._modes.clearMode('line');
				this._modes.setMode('marker');
				return;
			}
			this._modes.clearMode('marker');
			this._modes.setMode('line');
		});


		me._addLineTapActions();



		let _tapEvent = (event) => {

			if (me._isDragging) {
				return;
			}


			if (me._currentLine) {



				me._currentLineEdit.addPoint([event.position.latitude, event.position.longitude]);
				map.selectLine(me._currentLine);


				return;
			}



			map.addLine(extend(me._config.defaultLine, {
				'title': "Test",
				'clickable': true,
				'coordinates': [
					[event.position.latitude, event.position.longitude]
				],
				"_id": (new Date()).getTime() + ".0"
			})).then((line) => {
				me._currentLine = line;
				me._addLineEditor();

				map.selectLine(me._currentLine);
			}).catch(console.error);



		};



		this._modes.addMode('line', () => {
			setCurrentPageData('isDrawingLine', true);
			map.on('coordinateLongPress', _tapEvent);

		}, () => {
			setCurrentPageData('isDrawingLine', false);
			map.off('coordinateLongPress', _tapEvent);
			delete me._currentLine;
			if (me._currentLineEdit) {
				me._currentLineEdit.remove();
				delete me._currentLineEdit;
			}
		});



	}

	public _addLineTapActions() {

		let me = this;
		let map = me._map;
		let vertex = false;
		let _updateMenu = (item) => {
			let shape = item;

			if (me._currentLineEdit) {
				if (me._currentLineEdit.isVertex(item)) {
					vertex = true;
					shape = me._currentLineEdit.getLine();
				} else {

					me._currentLineEdit.clearSelected();
					vertex = false;

				}
			} else {
				vertex = false;
			}
			let buttons = [];

			if (shape === me._currentLine) {


				if (shape.getPoints().length > 1) {

					map.getActionButtons().addSaveBtn(() => {


						this._localLayer.saveLine(shape).then(()=>{
							this._modes.resetMode('line');
						}).catch((e)=>{
							console.error('LineMode Failed to save line');
							console.error(e);
						});

					});
				}


				if (vertex && shape.getPoints().length > 1) {


					map.getActionButtons().addRemoveVertBtn(() => {
						me._currentLineEdit.splice(item);
					});

				}

				map.getActionButtons().addRemoveBtn(() => {

					map.removeLine(shape);
					this._modes.resetMode('line');
				});



			}


			map.getActionButtons().show('shape');


		};
		map.on("shapeSelect", (event:ShapeEventData) => {
			_updateMenu(event.shape);
		});
		me.on("addLineEditor", (event) => {
			event.object.on("markerSelect", (event:MarkerEventData) => {
				_updateMenu(event.marker);
			});
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


}