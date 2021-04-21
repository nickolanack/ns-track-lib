import { Observable } from "@nativescript/core";
export interface ActionTemplateHandler {
    addAction: (name: string, func: () => void) => void;
    getActionName: (suffix: string) => string;
}
export declare abstract class TourBehavior extends Observable {
    protected _viewer: ActionTemplateHandler;
    protected _options: any;
    protected _tours: Array<any>;
    protected _points: Array<any>;
    protected _currentTour: number;
    protected _currentIndex: number;
    protected _currentTourData: any;
    constructor(viewer: ActionTemplateHandler, options: any);
    protected abstract startTour(): any;
    protected abstract focusTourStep(index: any): any;
    protected focusTourItem(tourItem: any): void;
    protected abstract endTour(): any;
    protected abstract getVisibleItemLocationData(tourItem: any, callback: any): any;
    protected abstract getItemLabel(tourItem: any, callback: any): any;
    setTourStep(index: any): void;
    protected hasDirections(): boolean;
    protected getDirectionsTo(index: number): any[];
    private polylineDecode;
    pickTour(): Promise<number>;
    isInTour(): boolean;
    addTour(tour: any): void;
    private toggleTour;
    displayDefualtNavigation(options?: any): void;
}
