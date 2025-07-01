export enum ESGeoShapeType {
    Point = 'point',
    Polygon = 'polygon',
    MultiPolygon = 'multipolygon'
}

export type ESGeoShapePoint = {
    type: ESGeoShapeType.Point;
    coordinates: CoordinateTuple;
};

export type ESGeoShapePolygon = {
    type: ESGeoShapeType.Polygon;
    coordinates: CoordinateTuple[][];
};

export type ESGeoShapeMultiPolygon = {
    type: ESGeoShapeType.MultiPolygon;
    coordinates: CoordinateTuple[][][];
};

export type ESGeoShape = ESGeoShapePoint | ESGeoShapePolygon | ESGeoShapeMultiPolygon;

export enum GeoShapeType {
    Point = 'Point',
    Polygon = 'Polygon',
    MultiPolygon = 'MultiPolygon',
}

export type GeoShapePoint = {
    type: GeoShapeType.Point;
    coordinates: CoordinateTuple;
};

export type GeoShapePolygon = {
    type: GeoShapeType.Polygon;
    coordinates: CoordinateTuple[][];
};

export type GeoShapeMultiPolygon = {
    type: GeoShapeType.MultiPolygon;
    coordinates: CoordinateTuple[][][];
};

export type GeoShape = GeoShapePoint | GeoShapePolygon | GeoShapeMultiPolygon;

export type JoinGeoShape = GeoShape | ESGeoShape;

export type CoordinateTuple = [lon: number, lat: number];

type GeoPointArr = [lon: number, lat: number];
type GeoPointStr = string;
type GeoObjShort = { lat: string | number; lon: string | number };
type GeoObjLong = { latitude: string | number; longitude: string | number };

export type GeoPointInput
    = GeoPointArr
        | GeoPointStr
        | GeoObjShort
        | GeoObjLong
        | GeoShapePoint;

export interface GeoPoint {
    readonly lat: number;
    readonly lon: number;
}

/**
 * A geo boundary is a box of geo points requiring at two geo points,
 * one point is the top left, the other is the bottom right
*/
export type GeoBoundary = readonly [topLeft: GeoPoint, bottomRight: GeoPoint];

export enum GeoShapeRelation {
    Intersects = 'intersects',
    Disjoint = 'disjoint',
    Within = 'within',
    Contains = 'contains'
}

export type GeoInput = GeoPointInput | GeoPointInput[] | GeoShape;

export type GeoDistanceUnit = 'miles' | 'yards' | 'feet' | 'inch' | 'kilometers' | 'meters' | 'centimeters' | 'millimeters' | 'nauticalmiles';

export const GEO_DISTANCE_UNITS: { readonly [key: string]: GeoDistanceUnit } = {
    mi: 'miles',
    miles: 'miles',
    mile: 'miles',
    NM: 'nauticalmiles',
    nmi: 'nauticalmiles',
    nauticalmile: 'nauticalmiles',
    nauticalmiles: 'nauticalmiles',
    in: 'inch',
    inch: 'inch',
    inches: 'inch',
    yd: 'yards',
    yard: 'yards',
    yards: 'yards',
    m: 'meters',
    meter: 'meters',
    meters: 'meters',
    km: 'kilometers',
    kilometer: 'kilometers',
    kilometers: 'kilometers',
    mm: 'millimeters',
    millimeter: 'millimeters',
    millimeters: 'millimeters',
    cm: 'centimeters',
    centimeter: 'centimeters',
    centimeters: 'centimeters',
    ft: 'feet',
    feet: 'feet',
};

export interface GeoDistanceObj {
    distance: number;
    unit: GeoDistanceUnit;
}
