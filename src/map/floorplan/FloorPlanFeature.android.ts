
import { Observable } from "@nativescript/core";





export class FloorPlanFeature extends Observable {
	private _map: any;
	constructor(map) {
		super();
		this._map = map;



		this._map.gMap.setOnIndoorStateChangeListener(new com.google.android.gms.maps.GoogleMap.OnIndoorStateChangeListener({
			onIndoorBuildingFocused: () => {

				// building?: com.google.android.gms.maps.model.IndoorBuilding
				let building = this._map.gMap.getFocusedBuilding() || null;

				let level = building ? building.getLevels().get(building.getActiveLevelIndex()) : null;

				let event = {
					eventName: "indoorBuildingFocused",
					object: this,
					android: building,
					building: building ? {
						"underground": building.isUnderground(),
						"levelsCount": building.getLevels().size(),
						"level": {
							"index": building.getActiveLevelIndex(),
							"name":  level.getName(),
							"shortName": level.getShortName()
						}
					} : null
				};

				this.notify(event);
			},
			onIndoorLevelActivated: (building?: com.google.android.gms.maps.model.IndoorBuilding) => {


				let level = building ? building.getLevels().get(building.getActiveLevelIndex()) : null;

				let event = {
					eventName: "indoorLevelActivated",
					object: this,
					android: level,
					level: level ? {
						"index": building.getLevels().indexOf(level),
						"name":  level.getName(),
						"shortName": level.getShortName()
					} : null

				};

				this.notify(event);
			}
		}));

	}

	public hide() {
		this._map.gMap.setIndoorEnabled(false);
		return this;
	}

	public show() {

		this._map.gMap.setIndoorEnabled(true);
		return this;
	}

}

