
type GeoPointArr = [number, number];
type GeoPointStr = string;
type GeoObjShort = {lat: string | number; lon: string | number};
type GeoObjLong = {latitude: string | number; longitude: string | number};
export type GeoPointInput =
    GeoPointArr|
    GeoPointStr|
    GeoObjShort|
    GeoObjLong|
    number[]|
    object;

export interface GeoDistanceObj {
    distance: number;
    unit: GeoDistanceUnit;
}

export interface GeoPoint {
    lat: number;
    lon: number;
}

export enum GeoShapeRelation {
    Intersects = 'intersects',
    Disjoint = 'disjoint',
    Within = 'within',
    Contains = 'contains'
}

export enum GeoShapeType {
    Point = 'Point',
    Polygon = 'Polygon',
    MultiPolygon = 'MultiPolygon',
}

export type GeoShapePoint = {
    type: GeoShapeType.Point;
    coordinates: CoordinateTuple;
}

export type GeoShapePolygon = {
    type: GeoShapeType.Polygon;
    coordinates: CoordinateTuple[][];
}

export type GeoShapeMultiPolygon = {
    type: GeoShapeType.MultiPolygon;
    coordinates: CoordinateTuple[][][];
}

export type GeoShape = GeoShapePoint | GeoShapePolygon | GeoShapeMultiPolygon;

export type CoordinateTuple = [number, number];

export type GeoDistanceUnit = 'miles'|'yards'|'feet'|'inch'|'kilometers'|'meters'|'centimeters'|'millimeters'|'nauticalmiles';

export enum FieldType {
    Geo = 'geo',
    Date = 'date',
    IP = 'ip',
    String = 'string',
    Integer = 'integer',
    Float = 'float',
    Boolean = 'boolean',
    Object = 'object',
    GeoPoint = 'geo-point',
    GeoJSON = 'geo-json'
}

export interface TypeConfig {
    [field: string]: FieldType;
}

export type JoinBy = 'AND'|'OR';
