import { AnyObject } from '@terascope/utils';

type GeoPointArr = [number, number];
type GeoPointStr = string;
type GeoObjShort = {lat: string | number; lon: string | number};
type GeoObjLong = {latitude: string | number; longitude: string | number};

export type GeoPointInput =
    GeoPointArr|
    GeoPointStr|
    GeoObjShort|
    GeoObjLong|
    GeoShapePoint;

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

export interface Variables {
    [key: string]: any;
}

export interface JoinQueryResult {
    query: string;
    variables: Variables;
}

export type CreateJoinQueryOptions = {
    typeConfig?: TypeConfig;
    fieldParams?: Record<string, string>;
    joinBy?: JoinBy;
    variables?: AnyObject;
};
