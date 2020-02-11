import { Logger } from '@terascope/utils';
import {
    GeoPoint,
    GeoDistanceUnit,
    TypeConfig,
    Variables,
    SortOrder
} from '../interfaces';

export type TranslatorOptions = {
    logger?: Logger;
    type_config?: TypeConfig;
    default_geo_field?: string;
    default_geo_sort_order?: SortOrder;
    default_geo_sort_unit?: GeoDistanceUnit|string;
    variables?: Variables;
};

export type UtilsTranslateQueryOptions = {
    logger: Logger;
    type_config: TypeConfig;
    default_geo_field?: string;
    geo_sort_point?: GeoPoint;
    geo_sort_order: SortOrder;
    geo_sort_unit: GeoDistanceUnit;
};
