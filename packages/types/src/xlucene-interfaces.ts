export enum XluceneFieldType {
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

export interface XluceneTypeConfig {
    [field: string]: XluceneFieldType;
}

export interface XluceneVariables {
    [key: string]: any;
}
