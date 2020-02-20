/* eslint-disable @typescript-eslint/class-name-casing */
export enum xLuceneFieldType {
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

export interface xLuceneTypeConfig {
    [field: string]: xLuceneFieldType;
}

export interface xLuceneVariables {
    [key: string]: any;
}
