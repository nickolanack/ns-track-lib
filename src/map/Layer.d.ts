import { MapView } from 'nativescript-google-maps-sdk';
export declare class Layer {
    protected _map: MapView;
    protected config: any;
    protected _items: Array<any>;
    constructor(options: any, map: any);
    getName(item: any): any;
    getDescription(item: any): any;
    isVisible(): any;
    addItem(item: any, data: any): this;
    getItemByFilter(fn: any): any;
    showItem(i: any): void;
    hideItem(i: any): void;
    toggleVisibility(): this;
}
