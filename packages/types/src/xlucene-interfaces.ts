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

export function isXLuceneFieldType(value: string): value is xLuceneFieldType {
    return Object.values(xLuceneFieldType).includes(value as xLuceneFieldType);
}

export interface xLuceneTypeConfig {
    [field: string]: xLuceneFieldType;
}

/**
 * xLucene variable definitions
*/
export interface xLuceneVariables {
    readonly [key: string]: any;
}
