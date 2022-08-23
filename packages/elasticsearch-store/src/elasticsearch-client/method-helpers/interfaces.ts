export * as Opensearch1Params from '@opensearch-project/opensearch/api/requestParams';
export * as Elasticsearch6Params from 'elasticsearch6/api/requestParams';
export * as Elasticsearch7Params from 'elasticsearch7/api/requestParams';
export * as Elasticsearch8TypeParams from 'elasticsearch8/lib/api/types';
export * as Elasticsearch8TypeWithBodyParams from 'elasticsearch8/lib/api/typesWithBodyKey';

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
