import { AnyObject } from '@terascope/utils';
import { SortOrder } from '../translator/interfaces';
import { TypeConfig, GeoDistanceUnit } from '../parser';

export interface QueryAccessConfig<T extends AnyObject = AnyObject> {
    excludes?: (keyof T)[];
    includes?: (keyof T)[];
    constraint?: string;
    prevent_prefix_wildcard?: boolean;
    allow_implicit_queries?: boolean;
    allow_empty_queries?: boolean;
    default_geo_field?: string;
    default_geo_sort_order?: SortOrder;
    default_geo_sort_unit?: GeoDistanceUnit|string;
    type_config?: TypeConfig;
}
