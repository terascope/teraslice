import { AnyObject } from '@terascope/utils';

export {
    GeoShapePoint,
    GeoShapeType,
    CoordinateTuple,
    GeoPointInput,
    GeoShapePolygon,
    GeoShapeMultiPolygon,
    GeoShape,
    ESGeoShapeType,
    ESGeoShape
} from '@terascope/datalib/src/interfaces';

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
