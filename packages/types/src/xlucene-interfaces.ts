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

export function isXLuceneFieldType(value: any): value is xLuceneFieldType {
    const possibleValues = Object.values(xLuceneFieldType);
    return possibleValues.includes(value);
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
