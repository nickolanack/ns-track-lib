import { Observable } from "@nativescript/core";
export declare class MapActionButtons extends Observable {
    private _fieldset;
    private _container;
    private _content;
    private _buttons;
    private _iconPath;
    constructor(container: any);
    private _clr;
    clearActions(): void;
    setActions(name: any, buttons: any): void;
    setIconPath(path: any): this;
    addRemoveBtn(fn: any): void;
    addRemoveVertBtn(fn: any): void;
    addEditBtn(fn: any): void;
    addSaveBtn(fn: any): void;
    show(name: any): this;
}
