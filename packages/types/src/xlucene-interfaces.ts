import type { ClientMetadata, SortOrder } from './elasticsearch-interfaces.js';
import type { GeoDistanceUnit, GeoPoint } from './geo-interfaces.js';
import type { Logger } from './logger.js';

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

export interface XluceneBaseOptions {
    type_config: xLuceneTypeConfig;
    variables?: xLuceneVariables;
}

export type XluceneTranslateQueryOptions = XluceneBaseOptions & Partial<ClientMetadata> & {
    logger?: Logger;
    geo_sort_config?: XluceneGeoSortConfig;
};

export type XluceneGeoSortConfig = {
    // field & point required
    field?: string;
    point?: GeoPoint;
    // order & unit can use defaults if not provided
    order?: SortOrder;
    unit?: GeoDistanceUnit;
    // defaults if no order/unit provided
    default_order: SortOrder;
    default_unit: GeoDistanceUnit;
};
