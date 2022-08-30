export * as Opensearch1Params from '@opensearch-project/opensearch/api/requestParams';
export * as Elasticsearch6Params from 'elasticsearch6/api/requestParams';
export * as Elasticsearch7Params from 'elasticsearch7/api/requestParams';
export * as Elasticsearch8TypeParams from 'elasticsearch8/lib/api/types';
export * as Elasticsearch8TypeWithBodyParams from 'elasticsearch8/lib/api/typesWithBodyKey';

type Duration = number;
type TimeUnit = 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';

export type TimeSpan = `${Duration}${TimeUnit}`;

export type ExpandWildcards = 'open' | 'closed' | 'hidden' | 'none' | 'all';

export type SearchTypes = 'query_then_fetch' | 'dfs_query_then_fetch';

export type SuggestMode = 'missing' |'popular' |'always';

export type ConflictOptions = 'abort' | 'proceed';

export type ScriptLangs = 'painless' | 'expression' | 'mustache' | 'java';

export type Health = 'green' | 'yellow' | 'red';

export type Bytes = 'b' | 'k' | 'kb' | 'm' | 'mb' | 'g' | 'gb' | 't' | 'tb' | 'p' | 'pb';

export interface Remote {
    host?: string;
    username?: string;
    password?: string;
    socket_timeout?: TimeSpan;
    connect_timeout?: TimeSpan;
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

export interface SearchResult<TDocument = Record<string, unknown>> {
    fields?: Record<string, any>
    found: boolean
    _index: string
    _type?: string;
    _score?: number;
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

export type WaitForActiveShardOptions = 'all';

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

export interface PluginStats {
    classname: string;
    description: string;
    opensearch_version: string;
    extended_plugins: string[];
    has_native_controller: boolean;
    java_version: string;
    name: string;
    version: string;
    licensed: boolean;
    type: string;
}

export type NodeRole = 'cluster_manager' | 'master' | 'data' | 'client' | 'ingest' | 'voting_only' | 'remote_cluster_client' | 'coordinating_only'

export type NodeRoles = NodeRole[];
export interface IndexTemplateProperties {
    aliases?: { [alias: string]: Alias },
    mappings?: Record<string, any>;
    settings?:Record<string, any>;
    index_patterns?: string | string[];
}

export interface Alias {
    filter?: string;
    index_routing?: string;
    is_hidden?: boolean;
    is_write_index?: boolean;
    routing?: string;
    search_routing?: string;
}
