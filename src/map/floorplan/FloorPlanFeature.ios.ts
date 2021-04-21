
import { Observable } from "@nativescript/core";

export class FloorPlanFeature extends Observable {
	private _map: any;
	private _delegate: GMSIndoorDisplayDelegateImpl;


	constructor(map) {
		super();
		this._map = map;
		this._delegate = GMSIndoorDisplayDelegateImpl.initWithOwner(new WeakRef(this));

		this._map.on('unloaded', () => {
			this._map.nativeView.indoorDisplay.delegate = null;
		});

	}

	public hide() {
		this._map.nativeView.indoorEnabled = false;
		this._map.nativeView.indoorDisplay.delegate = null;
		return this;
	}

	public show() {



		this._map.nativeView.indoorDisplay.delegate = this._delegate;
		this._map.nativeView.indoorEnabled = true;

		return this;
	}

	public _changeActiveBuilding(building?: GMSIndoorBuilding) {
		console.log(building);

		let level = building ? (<GMSIndoorDisplay>this._map.nativeView.indoorDisplay).activeLevel : null;
		let event = {
			eventName: "indoorBuildingFocused",
			object: this,
			ios: building,
			building: building ? {
				"underground": building.underground,
				"levelsCount": building.levels.count,
				"level": {
					"index": building.levels.indexOfObject(level),
					"name": level.name,
					"shortName": level.shortName
				}
			} : null

		};
		this.notify(event);
	}
	public _changeActiveLevel(level?: GMSIndoorLevel) {
		console.log(level);

		let building = (<GMSIndoorDisplay>this._map.nativeView.indoorDisplay).activeBuilding;

		let event = {
			eventName: "indoorLevelActivated",
			object: this,
			level: level ? {
				"index": building.levels.indexOfObject(level),
				"name": level.name,
				"shortName": level.shortName
			} : null,
			ios: level
		};
		this.notify(event);
	}

}




@NativeClass()
class GMSIndoorDisplayDelegateImpl extends NSObject implements GMSIndoorDisplayDelegate {

	public static ObjCProtocols = [GMSIndoorDisplayDelegate];

	private _owner: WeakRef<FloorPlanFeature>;

	public static initWithOwner(owner: WeakRef<FloorPlanFeature>): GMSIndoorDisplayDelegateImpl {
		let handler = <GMSIndoorDisplayDelegateImpl>GMSIndoorDisplayDelegateImpl.new();
		handler._owner = owner;
		return handler;
	}



	didChangeActiveBuilding(building?: GMSIndoorBuilding): void {

		let owner = this._owner.get();
		if (owner) {
			owner._changeActiveBuilding(building);
		}
	}


	didChangeActiveLevel(level?: GMSIndoorLevel) {

		let owner = this._owner.get();
		if (owner) {
			owner._changeActiveLevel(level);
		}
	}

}