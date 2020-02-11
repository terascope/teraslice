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
    ESGeoShape,
    GeoDistanceUnit
} from '@terascope/types';

export interface GeoDistanceObj {
    distance: number;
    unit: GeoDistanceUnit;
}

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
    GeoJSON = 'geo-json',
    Number = 'number'
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
