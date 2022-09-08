/* eslint-disable @typescript-eslint/no-empty-interface */
import * as i from './elasticsearch-types';

export interface DeleteByQueryResponse {
    batches?: number;
    deleted?: number;
    failures?: i.BulkIndexByScrollFailure[];
    noops?: number;
    requests_per_second?: number;
    retries?: {
        bulk: number;
        search: number;
    };
    slice_id?: number;
    task?: string | number;
    throttled_millis?: number;
    throttled_until_millis?: number;
    timed_out?: boolean;
    took?: number;
    total?: number;
    version_conflicts?: number;
}

export type ExistsResponse = boolean;

export type GetResponse<T = Record<string, any>> = i.SearchResult<T>

export interface IndexResponse extends i.WriteResponseBase {}

export interface IndicesCreateResponse {
    acknowledged: boolean;
    shards_acknowledged: boolean;
    index: string;
}

export interface IndicesDeleteResponse {
    acknowledged: boolean
}

export interface IndicesDeleteTemplateResponse {
    acknowledged: boolean
}

export type IndicesExistsResponse = boolean;

export type IndicesExistsTemplateResponse = boolean;

export interface IndicesGetResponse {
    [indexName: string]: {
        settings: Record<string, any>,
        mappings: Record<string, any>
    }
}

export type IndicesGetMappingResponse = Record<string, i.IndicesGetMappingIndexMappingRecord>

export interface IndicesPutTemplateResponse {
    acknowledged: boolean
}

export type IndicesRefreshResponse = {
    _shards: i.ShardStatistics;
}

export interface MGetResponse {
    docs: GetResponse[]
}

export interface MSearchResponse<T = Record<string, unknown>> {
    responses: i.IndividualResponse<T>[];
}

export interface TasksCancelResponse {
    node_failures?: Record<string, any>[];
    task_failures?: Record<string, any>[];
    nodes?: Record<string, any>;
    tasks?: Record<string, any>;
}

export interface TasksGetResponse {
    completed: boolean;
    task: Record<string, any>;
    response?: Record<string, any>;
    error?: Record<string, any>;
}

export interface TasksListResponse {
    node_failures?: Record<string, any>[];
    task_failures?: {
        task_id: number;
        node_id: string;
        status: string;
        reason: Record<string, any>;
    }[];
    nodes?: Record<string, any>;
    tasks?: Record<string, any>;
}

export interface UpdateResponse<TDocument = unknown> extends i.WriteResponseBase {
    get?: i.InlineGet<TDocument>;
}

export interface InfoResponse {
    name: string;
    cluster_name: string;
    cluster_uuid: string;
    version: {
        distribution?: string;
        number: string;
        build_flavor?: string;
        build_type: string;
        build_hash: string;
        build_date: string;
        build_snapshot: boolean;
        lucene_version: string;
        minimum_wire_compatibility_version: string;
        minimum_index_compatibility_version: string;
    },
    tagline: string;
}

export interface BulkResponse {
    errors: boolean;
    items: i.BulkResponseItemContainer[];
    took: number;
    ingest_took?: number;
}

export type CatIndicesResponse = i.CatIndicesIndicesRecord[];

export interface ClusterGetSettingsResponse {
    persistent: Record<string, any>;
    transient: Record<string, any>;
    defaults?: Record<string, any>;
}

export interface ClusterHealthResponse {
    active_primary_shards: number;
    active_shards: number;
    active_shards_percent_as_number: string | number;
    cluster_name: string;
    delayed_unassigned_shards: number;
    indices?: Record<string, i.ClusterHealthIndexHealthStats>;
    initializing_shards: number;
    number_of_data_nodes: number;
    number_of_in_flight_fetch: number;
    number_of_nodes: number;
    number_of_pending_tasks: number;
    relocating_shards: number;
    status: i.Health;
    task_max_waiting_in_queue_millis: string | number;
    timed_out: boolean;
    unassigned_shards: number;
}

export interface CountResponse {
    count: number;
}

export interface CreateResponse extends i.WriteResponseBase {}

export interface DeleteResponse extends i.WriteResponseBase {}

export type IndicesGetFieldMappingResponse = Record<
string,
i.IndicesGetFieldMappingTypeFieldMappings
>

export interface IndicesGetSettingsResponse {
    [key: string]: i.IndicesIndexState
}

export interface IndicesGetIndexTemplateResponse {
    index_templates: i.IndexTemplate[];
}

export interface IndicesGetTemplateResponse {
    [template: string]: i.TemplateBody;
}

export interface IndicesPutMappingResponse extends i.IndicesResponseBase {
    _shards: i.ShardStatistics
}

export interface IndicesPutSettingsResponse {
    _shards: i.ShardStatistics
}

export interface IndicesRecoveryResponse
    extends i.DictionaryResponseBase<i.IndicesRecoveryRecoveryStatus> { }

export interface IndicesValidateQueryResponse {
    explanations?: i.IndicesValidateQueryIndicesValidationExplanation[];
    _shards?: i.ShardStatistics;
    valid: boolean;
    error?: string;
}

export interface NodesInfoResponse {
    cluster_name: string;
    nodes: Record<string, i.NodesInfoNodeInfo>;
}

export interface NodesStatsResponse {
    cluster_name?: string;
    nodes: Record<string, i.NodesStats>;
    _nodes?: i.NodeStatistics;
}

export interface ReindexResponse {
    took: number;
    timed_out: boolean;
    total: number;
    updated: number;
    created: number;
    deleted: number;
    batches: number;
    noops: number;
    version_conflicts: number;
    retries: {
        bulk: number;
        search: number;
    };
    throttled_millis: number;
    requests_per_second: number;
    throttled_until_millis: number;
    failures: any[]
}

export interface SearchResponse<T = Record<string, unknown>> extends i.SearchRecordResponse<T> {}
