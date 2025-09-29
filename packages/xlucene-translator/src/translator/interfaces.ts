import type { Logger } from '@terascope/utils';
import {
    SortOrder, xLuceneTypeConfig, xLuceneVariables,
    GeoDistanceUnit, GeoPoint, ClientMetadata,
    TranslatorAggregations, GroupByAggregations
} from '@terascope/types';
import { ParserOptions } from 'xlucene-parser';

export interface TranslatorOptions extends ParserOptions {
    logger?: Logger;
    default_geo_field?: string;
    default_geo_sort_order?: SortOrder;
    default_geo_sort_unit?: GeoDistanceUnit | string;
}

/**
 * @internal
*/
export interface UtilsTranslateQueryOptions extends Partial<ClientMetadata> {
    logger: Logger;
    type_config: xLuceneTypeConfig;
    variables: xLuceneVariables;
    default_geo_field?: string;
    geo_sort_point?: GeoPoint;
    geo_sort_order: SortOrder;
    geo_sort_unit: GeoDistanceUnit;
    groupBy: GroupByAggregations;
    aggregations: TranslatorAggregations;
}
