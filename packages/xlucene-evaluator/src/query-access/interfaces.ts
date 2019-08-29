import { SearchParams } from 'elasticsearch';
import { AnyObject } from '@terascope/utils';
import { SortOrder, ElasticsearchDSLOptions } from '../translator/interfaces';
import { TypeConfig, GeoDistanceUnit, ParserOptions } from '../parser';

export interface RestrictSearchQueryOptions extends ElasticsearchDSLOptions {
    /**
     * Elasticsearch search parameters
     * _sourceInclude and _sourceExclude will be filtered based
     * on the excludes and includes fields specified in the config
    */
    params?: Partial<SearchParams>;
    /**
     * The elasticsearch version (to format the request properly)
     * @default 6
    */
    elasticsearch_version?: number;
}

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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryAccessOptions extends ParserOptions {
}
