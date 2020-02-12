import { Logger } from '@terascope/utils';
import {
    SortOrder,
    XluceneTypeConfig,
    XluceneVariables,
    GeoDistanceUnit,
    GeoPoint
} from '@terascope/types';

export type TranslatorOptions = {
    logger?: Logger;
    type_config?: XluceneTypeConfig;
    default_geo_field?: string;
    default_geo_sort_order?: SortOrder;
    default_geo_sort_unit?: GeoDistanceUnit|string;
    variables?: XluceneVariables;
};

export type UtilsTranslateQueryOptions = {
    logger: Logger;
    type_config: XluceneTypeConfig;
    default_geo_field?: string;
    geo_sort_point?: GeoPoint;
    geo_sort_order: SortOrder;
    geo_sort_unit: GeoDistanceUnit;
};
