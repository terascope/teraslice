export enum xLuceneFieldType {
    Geo = 'geo',
    Date = 'date',
    IP = 'ip',
    IPRange = 'ip_range',
    String = 'string',
    AnalyzedString = '~string',
    Integer = 'integer',
    Float = 'float',
    Boolean = 'boolean',
    Object = 'object',
    GeoPoint = 'geo-point',
    GeoJSON = 'geo-json',
    Number = 'number',
}

export interface xLuceneTypeConfig {
    [field: string]: xLuceneFieldType;
}

export interface xLuceneVariables {
    [key: string]: any;
}
