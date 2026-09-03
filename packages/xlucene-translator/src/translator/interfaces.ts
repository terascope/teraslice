import type { GeoDistanceUnit, Logger, SortOrder } from '@terascope/types';
import type { ParserOptions } from 'xlucene-parser';

export interface TranslatorOptions extends ParserOptions {
    logger?: Logger;
    default_geo_field?: string;
    default_geo_sort_order?: SortOrder;
    default_geo_sort_unit?: GeoDistanceUnit | string;
}
