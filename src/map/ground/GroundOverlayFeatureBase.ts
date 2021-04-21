


export interface GroundOverlay {
	image: string;
	north: number;
	south: number;
	east: number;
	west: number;
	rotation?: number;
	opacity?: number;
}

export abstract class GroundOverlayFeatureBase {


	public abstract hide();
	public abstract show();
	public abstract setOpacity(zoom: number);


}