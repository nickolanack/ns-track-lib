export declare class MapModes {
    private _mode;
    private _modes;
    constructor();
    isMode(mode: any): boolean;
    resetMode(mode: any): void;
    clearMode(mode: any): void;
    setMode(mode: any): void;
    addMode(mode: any, handler: any, cleanup: any): void;
}
