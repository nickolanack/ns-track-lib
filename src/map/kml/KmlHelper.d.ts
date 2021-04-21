export declare class KmlHelper {
    ConvertKMLColorToRGB(colorString: any): {
        color: string;
        opacity: number;
    };
    ConvertRGBColorToKML(rgb: any, opacity: any): string;
    ParseDomDocuments(xmlDom: any): any[];
    ParseDomFolders(xmlDom: any): any[];
    ParseDomDoc(xmlDom: any): {};
    ParseDomLinks(xmlDom: any): any[];
    ParseDomFolder(xmlDom: any): {};
    ParseDomLink(xmlDom: any): {
        type: string;
    };
    ParseDomLines(xmlDom: any): any[];
    ParseDomGroundOverlays(xmlDom: any): any[];
    ParseDomPolygons(xmlDom: any): any[];
    ParseDomMarkers(xmlDom: any): any[];
    ParseDomCoordinates(xmlDom: any): any[];
    ParseDomBounds(xmlDom: any): {
        north: any;
        south: any;
        east: any;
        west: any;
    };
    ParseNonSpatialDomData(xmlDom: any, options: any): {
        name: string;
        description: any;
        tags: {};
    };
    ParseTag(xmlDom: any): {
        name: any;
        value: {};
    };
    WithinOffsetDom(parent: any, child: any, max: any): boolean;
    ParseDomStyle(xmlDom: any, options?: any): any;
    ParseDomIcon(xmlDom: any, options?: any): {
        url: any;
        scale: any;
    };
    ResolveDomStyle(style: any, xmlDom: any): {};
    ParseDomItems(xmlDom: any, tag: any): any[];
    Value(node: any): any;
    ChildNodesArray(node: any): any[];
}
