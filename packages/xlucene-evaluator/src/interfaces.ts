
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

export type GeoDistanceUnit = 'miles'|'yards'|'feet'|'inch'|'kilometers'|'meters'|'centimeters'|'millimeters'|'nauticalmiles';

export enum FieldType {
    Geo = 'geo',
    Date = 'date',
    IP = 'ip',
    String = 'string',
    Integer = 'integer',
    Float = 'float',
    Boolean = 'boolean',
    Object = 'object'
}

export interface TypeConfig {
    [field: string]: FieldType;
}

export type JoinBy = 'AND'|'OR';
