export declare class KmlParser {
    private _kml;
    private _filters;
    constructor(kml: any);
    parseDocuments(kml: any, callback: any): this;
    parseFolders(kml: any, callback: any): this;
    parseMarkers(callback: any): any;
    parsePolygons(callback: any): any;
    parseLines(kml: any, callback: any): this;
    parseGroundOverlays(kml: any, callback: any): this;
    parseNetworklinks(kml: any, callback: any): this;
    _filter(a: any): any;
    addFilter(filter: any): this;
}
