import type { Logger } from '@terascope/core-utils';
import {
    GeoDistanceUnit, GeoPoint, SortOrder,
    SQLDialect, xLuceneTypeConfig, xLuceneVariables
} from '@terascope/types';

/**
 * @internal
*/
export interface UtilsTranslateSQLOptions {
    logger: Logger;
    type_config: xLuceneTypeConfig;
    variables: xLuceneVariables;
    dialect: SQLDialect;
    default_geo_field?: string;
    geo_sort_point?: GeoPoint;
    geo_sort_order: SortOrder;
    geo_sort_unit: GeoDistanceUnit;
}
