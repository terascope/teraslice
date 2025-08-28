import type { AnyObject } from '@terascope/utils';
import {
    SortOrder, ElasticsearchDSLOptions, xLuceneTypeConfig,
    xLuceneVariables, GeoDistanceUnit, ClientParams,
} from '@terascope/types';
import { ParserOptions } from 'xlucene-parser';

export interface RestrictSearchQueryOptions extends ElasticsearchDSLOptions {
    variables?: xLuceneVariables;
    /**
     * Elasticsearch search parameters
     * _source_includes and _source_excludes will be filtered based
     * on the excludes and includes fields specified in the config
    */
    params?: Partial<ClientParams.SearchParams>;
}

export interface RestrictOptions {
    variables?: xLuceneVariables;
}

export interface QueryAccessConfig<T extends AnyObject = AnyObject> {
    excludes?: (keyof T)[];
    includes?: (keyof T)[];
    constraint?: string | string[];
    prevent_prefix_wildcard?: boolean;
    allow_implicit_queries?: boolean;
    allow_empty_queries?: boolean;
    default_geo_field?: string;
    default_geo_sort_order?: SortOrder;
    default_geo_sort_unit?: GeoDistanceUnit | string;
    type_config?: xLuceneTypeConfig;
}

export interface QueryAccessOptions extends ParserOptions {
    variables?: xLuceneVariables;
}
