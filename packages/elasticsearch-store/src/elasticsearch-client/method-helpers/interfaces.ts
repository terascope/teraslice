export * as Opensearch1Params from '@opensearch-project/opensearch/api/requestParams';
export * as Elasticsearch6Params from 'elasticsearch6/api/requestParams';
export * as Elasticsearch7Params from 'elasticsearch7/api/requestParams';
export * as Elasticsearch8TypeParams from 'elasticsearch8/lib/api/types';
export * as Elasticsearch8TypeWithBodyParams from 'elasticsearch8/lib/api/typesWithBodyKey';

export interface ExistsParams {
    id: string;
    index: string;
    type?: string;
    preference?: string;
    realtime?: boolean;
    refresh?: boolean;
    routing?: string;
}

type TimeValue = number;
type TimeUnit = 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';

export type TimePeriod = `${TimeValue}${TimeUnit}`;

export interface SearchParams {
    allow_no_indices?: boolean;
    allow_partial_search_results?: boolean;
    analyzer?: string;
    analyze_wildcard?: boolean;
    batched_reduce_size?: number;
    body?: Record<string, any>;
    ccs_minimize_roundtrips?: boolean;
    default_operator?: string;
    df?: string;
    docvalue_fields?: string;
    expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
    explain?: boolean;
    from?:number;
    index?: string;
    ignore?: number | number[];
    ignore_throttled?: boolean;
    ignore_unavailable?: boolean;
    lenient?: boolean;
    max_concurrent_shard_requests?: number;
    min_compatible_shard_node?: string;
    pre_filter_shard_size?: number;
    preference?: string; // define this
    q?: string;
    request_cache?: boolean;
    rest_total_hits_as_int?: boolean;
    routing?: string;
    scroll?: TimePeriod;
    search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
    seq_no_primary_term?: boolean;
    size?: number;
    sort?: string;
    _source?: boolean | string;
    _source_excludes?: string;
    _source_includes?: string;
    stats?: string | string[];
    stored_fields?: string;
    suggest_field?: string;
    suggest_mode?: 'missing' | 'popular' | 'always';
    suggest_size?: number;
    suggest_text?: string;
    terminate_after?: number;
    timeout?: TimePeriod;
    track_scores?: boolean
    track_total_hits?: boolean | number;
    type?: string;
    typed_keys?: boolean;
    version?: boolean;
}
