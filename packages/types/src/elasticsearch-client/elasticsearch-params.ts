import * as i from './elasticsearch-types.js';

export interface IndicesStatsParams {
    metric?: i.Metrics;
    index?: string | string[];
    completion_fields?: string | string[];
    fielddata_fields?: string | string[];
    fields?: string | string[];
    groups?: string | string[];
    level?: i.Level;
    expand_wildcards?: i.ExpandWildcards;
}

export interface DeleteByQueryParams {
    index: string | string[];
    analyzer?: string;
    analyze_wildcard?: boolean;
    from?: number;
    ignore_unavailable?: boolean;
    allow_no_indices?: boolean;
    conflicts?: 'abort' | 'proceed';
    expand_wildcards?: i.ExpandWildcards;
    lenient?: boolean;
    preference?: string;
    q?: string;
    routing?: string | string[];
    scroll?: string;
    search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
    search_timeout?: string;
    size?: number;
    max_docs?: number;
    sort?: string | string[];
    terminate_after?: number;
    stats?: string | string[];
    version?: boolean;
    request_cache?: boolean;
    refresh?: boolean;
    timeout?: string;
    wait_for_active_shards?: string;
    scroll_size?: number;
    wait_for_completion?: boolean;
    requests_per_second?: number;
    slices?: number | string;
    body?: Record<string, any>;
}

export interface ExistsParams {
    id: string;
    index: string;
    preference?: string;
    realtime?: boolean;
    refresh?: boolean;
    routing?: string;
}

export interface GetParams {
    id: string;
    index: string;
    stored_fields?: string | string[];
    preference?: string;
    realtime?: boolean;
    refresh?: boolean;
    routing?: string;
    _source?: boolean | string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    version?: number;
    version_type?: i.VersionType;
}

export interface IndexParams<TDocument = unknown> {
    id?: string;
    index: string;
    op_type?: i.OpType;
    refresh?: i.IndexRefresh;
    routing?: string;
    timeout?: string | number;
    if_seq_no?: number;
    if_primary_term?: number;
    version?: number;
    version_type?: i.VersionType;
    wait_for_active_shards?: i.WaitForActiveShards;
    body?: TDocument;
}

export interface IndicesStats {
    metric?: string | string[];
    index?: string | string[];
    completion_fields?: string | string[];
    fielddata_fields?: string | string[];
    fields?: string | string[];
    groups?: string | string[];
    level?: i.Level;
    include_segment_file_sizes?: boolean;
    include_unloaded_segments?: boolean;
    expand_wildcards?: i.ExpandWildcards;
    forbid_closed_indices?: boolean;
}

export interface IndicesCreateParams {
    index: string;
    wait_for_active_shards?: i.WaitForActiveShards;
    timeout?: i.TimeSpan;
    master_timeout?: i.TimeSpan;
    body?: i.IndexTemplateProperties;
}

export interface IndicesDeleteParams {
    index: string | string[];
    timeout?: i.TimeSpan;
    master_timeout?: i.TimeSpan;
    ignore_unavailable?: boolean;
    allow_no_indices?: boolean;
    expand_wildcards?: i.ExpandWildcards;
}

export interface IndicesDeleteTemplateParams {
    name: string;
    master_timeout?: i.TimeSpan;
}

export interface IndicesExistsParams {
    index: string | string[];
    local?: boolean;
    ignore_unavailable?: boolean;
    allow_no_indices?: boolean;
    expand_wildcards?: i.ExpandWildcards;
    flat_settings?: boolean;
    include_defaults?: boolean;
}

export interface IndicesExistsTemplateParams {
    name: string | string[];
    flat_settings?: boolean;
    master_timeout?: i.TimeSpan;
    local?: boolean;
}

export interface IndicesGetParams {
    index: string | string[];
    local?: boolean;
    ignore_unavailable?: boolean;
    allow_no_indices?: boolean;
    expand_wildcards?: i.ExpandWildcards;
    flat_settings?: boolean;
    include_defaults?: boolean;
    master_timeout?: i.TimeSpan;
}

export interface IndicesGetFieldMappingParams {
    fields: string | string[];
    index?: string | string[];
    allow_no_indices?: boolean;
    expand_wildcards?: i.ExpandWildcards;
    ignore_unavailable?: boolean;
    include_defaults?: boolean;
    local?: boolean;
}

export interface IndicesGetIndexTemplateParams {
    name?: string | string[];
    flat_settings?: boolean;
    master_timeout?: i.TimeSpan;
    local?: boolean;
}

export interface IndicesGetMappingParams {
    index?: string | string[];
    allow_no_indices?: boolean;
    expand_wildcards?: i.ExpandWildcards;
    ignore_unavailable?: boolean;
    local?: boolean;
    master_timeout?: string | number;
}

export interface IndicesGetSettingsParams {
    index?: string | string[];
    name?: string | string[];
    allow_no_indices?: boolean;
    expand_wildcards?: i.ExpandWildcards;
    flat_settings?: boolean;
    ignore_unavailable?: boolean;
    include_defaults?: boolean;
    local?: boolean;
    master_timeout?: number | string;
}

export interface IndicesGetTemplateParams {
    name?: string | string[];
    flat_settings?: boolean;
    master_timeout?: i.TimeSpan;
    local?: boolean;
}

export interface IndicesPutMappingParams {
    index?: string | string [];
    allow_no_indices?: boolean;
    expand_wildcards?: i.ExpandWildcards;
    ignore_unavailable?: boolean;
    master_timeout?: string | number;
    timeout?: string | number;
    write_index_only?: boolean;
    body?: {
        all_field?: i.MappingAllField;
        date_detection?: boolean;
        dynamic?: boolean | i.MappingDynamicMapping;
        dynamic_date_formats?: string[];
        dynamic_templates?:
            | Record<string, i.MappingDynamicTemplate>
            | Record<string, i.MappingDynamicTemplate>[];
        field_names_field?: i.MappingFieldNamesField;
        index_field?: i.MappingIndexField;
        meta?: Record<string, any>;
        numeric_detection?: boolean;
        properties?: Record<string, i.MappingProperty>;
        routing_field?: i.MappingRoutingField;
        size_field?: i.MappingSizeField;
        source_field?: i.MappingSourceField;
        runtime?: i.MappingRuntimeFields;
    };
}

export interface IndicesPutSettingsParams {
    index?: string | string [];
    allow_no_indices?: boolean;
    expand_wildcards?: i.ExpandWildcards;
    flat_settings?: boolean;
    ignore_unavailable?: boolean;
    cluster_manager_timeout?: number | string;
    master_timeout?: number | string;
    preserve_existing?: boolean;
    timeout?: number | string;
    body: i.IndicesPutSettingsIndexSettingsBody;
}

export interface IndicesPutTemplateParams {
    name: string;
    order?: number;
    create?: boolean;
    master_timeout?: i.TimeSpan;
    body: i.IndexTemplateProperties;
}

export interface IndicesRecoveryParams {
    index?: string | string[];
    active_only?: boolean;
    detailed?: boolean;
}

export interface IndicesRefreshParams {
    index?: string;
    allow_no_indices?: boolean;
    expand_wildcards?: i.ExpandWildcards;
    ignore_unavailable?: boolean;
}

export interface IndicesValidateQueryParams {
    index?: string | string[];
    allow_no_indices?: boolean;
    all_shards?: boolean;
    analyzer?: string;
    analyze_wildcard?: boolean;
    default_operator?: 'AND' | 'OR';
    df?: string;
    expand_wildcards?: i.ExpandWildcards;
    explain?: boolean;
    ignore_unavailable?: boolean;
    lenient?: boolean;
    query_on_query_string?: string;
    rewrite?: boolean;
    q?: string;
    body?: Record<string, any>;
}

export interface MGetParams {
    index?: string;
    stored_fields?: string | string[];
    preference?: string;
    realtime?: boolean;
    refresh?: boolean;
    routing?: string;
    _source?: boolean | string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    body: i.MGetBody;
}

export interface MSearchParams {
    body: (i.MSearchHeader | i.MSearchBody)[];
    ccs_minimize_roundtrips?: boolean;
    index?: string | string[];
    max_concurrent_searches?: number;
    max_concurrent_shard_requests?: number;
    pre_filter_shard_size?: number;
    rest_total_hits_as_int?: boolean;
    search_type?: i.SearchTypes;
    typed_keys?: boolean;
}

export interface NodesInfoParams {
    node_id?: string;
    metric?: string | string[];
    flat_settings?: boolean;
    master_timeout?: string | number;
    timeout?: string | number;
}

export interface NodesStatsParams {
    node_id?: string | string[];
    metric?: i.Metrics;
    index_metric?: i.Metrics;
    completion_fields?: string | string[];
    fielddata_fields?: string | string[];
    fields?: string | string[];
    groups?: boolean;
    include_segment_file_sizes?: boolean;
    level?: i.Level;
    master_timeout?: number | string;
    timeout?: number | string;
    include_unloaded_segments?: boolean;
}

export interface ReindexParams {
    refresh?: boolean;
    timeout?: string;
    wait_for_active_shards?: 'all' | number;
    wait_for_completion?: boolean;
    requests_per_second?: number;
    scroll?: string;
    slices?: number | string;
    max_docs?: number;
    body: i.ReindexBody;
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
    expand_wildcards?: i.ExpandWildcards;
    explain?: boolean;
    from?: number;
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
    routing?: string | string[];
    scroll?: i.TimeSpan;
    search_type?: i.SearchTypes;
    seq_no_primary_term?: boolean;
    size?: number;
    sort?: string;
    _source?: boolean | string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    stats?: string | string[];
    stored_fields?: string;
    suggest_field?: string;
    suggest_mode?: i.SuggestMode;
    suggest_size?: number;
    suggest_text?: string;
    terminate_after?: number;
    timeout?: i.TimeSpan;
    track_scores?: boolean;
    track_total_hits?: boolean | number;
    typed_keys?: boolean;
    version?: boolean;
}

export interface TasksCancelParams {
    task_id?: string | number;
    actions?: string | string[];
    nodes?: string[];
    parent_task_id?: string;
    wait_for_completion?: boolean;
}

export interface TasksGetParams {
    task_id: string | number;
    timeout?: i.TimeSpan;
    wait_for_completion?: boolean;
}

export interface TasksListParams {
    nodes?: string | string[];
    actions?: string | string[];
    detailed?: boolean;
    parent_task_id?: string;
    wait_for_completion?: boolean;
    node_id?: string[];
    group_by?: 'nodes' | 'parents' | 'none';
    timeout?: i.TimeSpan;
}

export interface UpdateParams<TDocument = unknown, TPartialDocument = unknown> {
    id: string;
    index: string;
    lang?: string;
    refresh?: boolean;
    require_alias?: boolean;
    retry_on_conflict?: number;
    routing?: string;
    source_enabled?: boolean;
    timeout?: string | number;
    wait_for_active_shards?: i.WaitForActiveShards;
    _source?: boolean | string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    if_seq_no?: number;
    if_primary_term?: number;
    version?: number;
    body?: {
        detect_noop?: boolean;
        doc?: TPartialDocument;
        doc_as_upsert?: boolean;
        script?: i.Script;
        scripted_upsert?: boolean;
        _source?: boolean | i.SearchSourceFilter;
        upsert?: TDocument;
    };
}

export interface BulkParams<TDocument = unknown, TPartialDocument = unknown> {
    index?: string;
    refresh?: i.IndexRefresh;
    routing?: string;
    _source?: boolean | string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    timeout?: string | number;
    wait_for_active_shards?: i.WaitForActiveShards;
    require_alias?: boolean;
    body?: (
        | i.BulkOperationContainer
        | i.BulkUpdateAction<TDocument, TPartialDocument>
        | TDocument
    )[];
}

export interface CatIndicesParams {
    index?: string | string[];
    bytes?: i.Bytes;
    expand_wildcards?: i.ExpandWildcards;
    health?: i.Health;
    include_unloaded_segments?: boolean;
    pri?: boolean;
    format?: string;
    h?: string | string[];
    help?: boolean;
    local?: boolean;
    master_timeout?: string | number;
    s?: string[];
    v?: boolean;
}

export interface ClusterGetSettingsParams {
    flat_settings?: boolean;
    include_defaults?: boolean;
    timeout?: string | number;
}

export interface ClusterHealthParams {
    index?: string | string[];
    level?: 'cluster' | 'indices' | 'shards';
    local?: boolean;
    master_timeout?: string;
    timeout?: string;
    wait_for_active_shards?: string;
    wait_for_nodes?: string;
    wait_for_events?: 'immediate' | 'urgent' | 'high' | 'normal' | 'low' | 'languid';
    wait_for_no_relocating_shards?: boolean;
    wait_for_no_initializing_shards?: boolean;
    wait_for_status?: i.Health;
}

export interface CountParams {
    index: string | string[];
    ignore_unavailable?: boolean;
    ignore_throttled?: boolean;
    allow_no_indices?: boolean;
    expand_wildcards?: i.ExpandWildcards;
    min_score?: number;
    preference?: string;
    routing?: string | string[];
    q?: string;
    analyzer?: string;
    analyze_wildcard?: boolean;
    lenient?: boolean;
    body?: Record<string, any>;
}

export interface CreateParams<TDocument = unknown> {
    id: string;
    index: string;
    refresh?: i.IndexRefresh;
    routing?: string;
    timeout?: string | number;
    version?: number;
    version_type?: i.VersionType;
    wait_for_active_shards?: i.WaitForActiveShards;
    body?: TDocument;
}

export interface DeleteParams {
    id: string;
    index: string;
    if_primary_term?: number;
    if_seq_no?: number;
    refresh?: 'true' | 'false' | 'wait_for' | boolean;
    routing?: string;
    timeout?: string | number;
    version?: number;
    version_type?: i.VersionType;
    wait_for_active_shards?: number | 'all';
}
