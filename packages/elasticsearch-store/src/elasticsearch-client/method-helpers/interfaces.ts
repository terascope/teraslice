export * as Opensearch1Params from '@opensearch-project/opensearch/api/requestParams';
export * as Elasticsearch6Params from 'elasticsearch6/api/requestParams';
export * as Elasticsearch7Params from 'elasticsearch7/api/requestParams';
export * as Elasticsearch8TypeParams from 'elasticsearch8/lib/api/types';
export * as Elasticsearch8TypeWithBodyParams from 'elasticsearch8/lib/api/typesWithBodyKey';

type Duration = number;
type TimeUnit = 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';

export type TimeValue = `${Duration}${TimeUnit}`;

export enum ExpandWildcards {
    open = 'open',
    closed = 'closed',
    hidden = 'hidden',
    none = 'none',
    all = 'all'
}

export enum SearchTypes {
    query_then_fetch = 'query_then_fetch',
    dfs_query_then_fetch = 'dfs_query_then_fetch'
}

export enum SuggestModes {
    missing = 'missing',
    popular = 'popular',
    always = 'always'
}

export interface ExistsParams {
    id: string;
    index: string;
    type?: string;
    preference?: string;
    realtime?: boolean;
    refresh?: boolean;
    routing?: string;
}

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
    expand_wildcards?: ExpandWildcards,
    explain?: boolean;
    from?:number;
    index?: string | string[];
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
    scroll?: TimeValue;
    search_type?: SearchTypes;
    seq_no_primary_term?: boolean;
    size?: number;
    sort?: string;
    _source?: boolean | string;
    _source_excludes?: string;
    _source_includes?: string;
    stats?: string | string[];
    stored_fields?: string;
    suggest_field?: string;
    suggest_mode?: SuggestModes;
    suggest_size?: number;
    suggest_text?: string;
    terminate_after?: number;
    timeout?: TimeValue;
    track_scores?: boolean
    track_total_hits?: boolean | number;
    type?: string;
    typed_keys?: boolean;
    version?: boolean;
}

export interface MSearchParams {
    body: (MSearchHeader | MSearchBody)[];
    ccs_minimize_roundtrips?: boolean;
    index?: string | string[];
    max_concurrent_searches?: number;
    max_concurrent_shard_requests?: number;
    pre_filter_shard_size?: number;
    rest_total_hits_as_int?: boolean;
    type?: string | string[];
    search_type?: SearchTypes;
    typed_keys?: boolean;
}

export interface MSearchHeader {
    type?: string;
    allow_no_indices?: boolean;
    expand_wildcards?: ExpandWildcards;
    ignore_unavailable?: boolean;
    index?: string | string[];
    preference?: string;
    request_cache?: boolean;
    routing?: string;
    search_type?: SearchTypes;
}

export interface MSearchBody {
    track_total_hits?: boolean | number;
    query: Record <string, any>;
    from?: number;
    size?: number;
}

export interface MGetParams {
    index?: string;
    type?: string;
    stored_fields?: string | string[];
    preference?: string;
    realtime?: boolean;
    refresh?: boolean;
    routing?: string;
    _source?: string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    body: {
        docs?: MGetDocs[];
        ids?: string[];
    }
}

interface MGetDocs {
    _id: string;
    _index?: string;
    _type?: string;
    _source?: boolean;
    routing?: string;
    source_includes?: string | string[];
    source_excludes?: string | string[];
    _stored_fields?: string | string[];
}

export interface ReIndexParams {
    refresh?: boolean;
    timeout?: string;
    wait_for_active_shards?: 'all' | number;
    wait_for_completion?: boolean;
    requests_per_second?: number;
    scroll?: string;
    slices?: number | string;
    max_docs?: number;
    body: ReIndexBody;
}

export interface ReIndexBody {
    conflicts?: ConflictOptions;
    max_docs?: number;
    source: {
        index: string;
        query?: Record<string, any>;
        remote?: {
            host?: string;
            username?: string;
            password?: string;
            socket_timeout?: TimeValue;
            connect_timeout?: TimeValue;
        },
        size?: number;
        slice?: {
            id?: number;
            max?: number;
        },
        _source?: boolean | string | string[];
    },
    dest: {
        index: string;
        version_type?: VersionTypes;
        op_type?: OpTypes;
        type?: string;
    },
    script?: {
        source?: string;
        lang?: ScriptLangs;
    }
}

export enum ConflictOptions {
    abort = 'abort',
    proceed = 'proceed'
}

export enum OpTypes {
    index = 'index',
    create = 'create'
}

export enum VersionTypes {
    internal = 'internal',
    external = 'external',
    external_gt = 'external_gt',
    external_gte = 'external_gte'
}

export enum ScriptLangs {
    painless = 'painless',
    expression = 'expression',
    mustache = 'mustache',
    java = 'java'
}

export interface ErrorCauseKeys {
    type: string;
    reason: string;
    stack_trace?: string;
    caused_by?: ErrorCause;
    root_cause?: ErrorCause[];
    suppressed?: ErrorCause[];
}

export declare type ErrorCause = ErrorCauseKeys & {
    [property: string]: any;
};
export interface BulkIndexByScrollFailure {
    cause: ErrorCause;
    id: string;
    index: string;
    status: number;
    type: string;
}

export interface SearchResult<TDocument = unknown> {
    _index: string
    fields?: Record<string, any>
    found: boolean
    _id: string
    _primary_term?: number
    _routing?: string
    _seq_no?: number
    _source?: TDocument
    _version?: number
}

export interface ShardFailure {
    index?: string;
    node?: string;
    reason: ErrorCause;
    shard: number;
    status?: string;
}

export type IndexRefresh = boolean | RefreshOptions;
export type RefreshOptions = 'wait_for';

export type VersionType = 'internal' | 'external' | 'external_gte' | 'force';
export type Action = 'Error' | 'created' | 'updated' | 'deleted' | 'not_found' | 'noop';

export interface ShardStatistics {
    failed: number;
    successful: number;
    total: number;
    failures?: ShardFailure[];
    skipped?: number;
}

export interface WriteResponseBase {
    _id: string;
    _index: string;
    _primary_term: number;
    result: Action;
    _seq_no: number;
    _shards: ShardStatistics,
    _version: number;
    forced_refresh?: boolean;
    error?: ErrorCauseKeys;
}

export type WaitForActiveShardOptions = 'all'

export type WaitForActiveShards = number | WaitForActiveShardOptions

export type OpType = 'index' | 'create';

export type ScriptLanguage = 'painless' | 'expression' | 'mustache' | 'java';

export interface IndexedScript extends ScriptBase {
    id: string;
}

export interface ScriptBase {
    lang?: ScriptLanguage;
    params?: Record<string, any>;
}
export interface InlineScript extends ScriptBase {
    source: string;
}

export type Script = InlineScript | IndexedScript | string;

export interface SearchSourceFilter {
    excludes?: string | string[];
    includes?: string | string[];
    exclude?: string | string[];
    include?: string | string[];
}

export interface InlineGet<TDocument = unknown> {
    fields?: Record<string, any>;
    found: boolean;
    _seq_no: number;
    _primary_term: number;
    _routing?: string;
    _source: TDocument;
}
