export interface GroundOverlay {
    image: string;
    north: number;
    south: number;
    east: number;
    west: number;
    rotation?: number;
    opacity?: number;
}
export declare abstract class GroundOverlayFeatureBase {
    abstract hide(): any;
    abstract show(): any;
    abstract setOpacity(number: number): any;
}
