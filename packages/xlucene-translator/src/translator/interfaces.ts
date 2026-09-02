import type { Logger } from '@terascope/core-utils';
import {
    SortOrder, xLuceneTypeConfig, xLuceneVariables,
    GeoDistanceUnit, GeoPoint, ClientMetadata
} from '@terascope/types';
import { ParserOptions } from 'xlucene-parser';

export interface TranslatorOptions extends ParserOptions {
    logger?: Logger;
    default_geo_field?: string;
    default_geo_sort_order?: SortOrder;
    default_geo_sort_unit?: GeoDistanceUnit | string;
}

export type TranslatorGeoConfig = {
    // field & point required
    field?: string;
    point?: GeoPoint;
    // order & unit can use defaults if not provided
    order?: SortOrder;
    unit?: GeoDistanceUnit;
    default_order: SortOrder;
    default_unit: GeoDistanceUnit;
};

/**
 * @internal
*/
export interface UtilsTranslateQueryOptions extends Partial<ClientMetadata> {
    logger: Logger;
    type_config: xLuceneTypeConfig;
    variables: xLuceneVariables;
    geo_sort: TranslatorGeoConfig;
}
