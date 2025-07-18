import * as geo from './geo-interfaces.js';

/**
 * The sort direction
*/
export type SortOrder = 'asc' | 'desc';

export interface ElasticsearchDSLOptions extends Partial<ClientMetadata> {
    /**
     * If a default_geo_field is set, this is required to enable sorting
    */
    geo_sort_point?: geo.GeoPoint;
    geo_sort_order?: SortOrder;
    geo_sort_unit?: geo.GeoDistanceUnit;
}

export type BoolQuery = {
    bool: {
        filter?: AnyQuery[];
        must_not?: AnyQuery[];
        should?: AnyQuery[];
    };
};

export type BoolQueryTypes = 'filter' | 'should' | 'must_not';

export type AnyQuery
    = | BoolQuery
        | GeoQuery
        | TermQuery
        | MatchQuery
        | MatchPhraseQuery
        | WildcardQuery
        | ExistsQuery
        | RegExprQuery
        | QueryStringQuery
        | RangeQuery
        | MultiMatchQuery;

export interface ExistsQuery {
    exists: {
        field: string;
    };
}

export interface GeoQuery {
    geo_bounding_box?: {
        [field: string]: {
            top_left: geo.GeoPoint | string;
            bottom_right: geo.GeoPoint | string;
        };
    };
    geo_distance?: {
        distance: string;
        [field: string]: geo.GeoPoint | string;
    };
    geo_polygon?: {
        [field: string]: {
            points: geo.GeoPoint[] | string[] | geo.CoordinateTuple[];
        };
    };
    geo_shape?: {
        [field: string]: {
            shape: geo.ESGeoShape;
            relation: geo.GeoShapeRelation;
        };
    };
}

export interface RegExprQuery {
    regexp: {
        [field: string]: string | {
            value: string;
            flags?: string;
            max_determinized_states?: number;
        };
    };
}

export interface QueryStringQuery {
    query_string: {
        fields: string[];
        query: string;
    };
}

export interface MatchQuery {
    match: {
        [field: string]: {
            query: string;
            operator: 'and' | 'or';
        };
    };
}

export interface MatchPhraseQuery {
    match_phrase: {
        [field: string]: {
            query: string;
        };
    };
}

export interface TermQuery {
    term: {
        [field: string]: number | boolean;
    };
}

export interface WildcardQuery {
    wildcard: {
        [field: string]: string;
    };
}

export interface RangeQuery {
    range: {
        [field: string]: RangeExpression;
    };
}

export interface MultiMatchQuery {
    multi_match: {
        query: string;
        fields?: string[];
    };
}

export interface RangeExpression {
    gte?: string | number;
    lte?: string | number;
    gt?: string | number;
    lt?: string | number;
}

export type ConstantScoreQuery = {
    constant_score: {
        filter: AnyQuery | AnyQuery[];
    };
};

export type MatchAllQuery = {
    match_all: Record<string, never>;
};

export type MatchNoneQuery = {
    match_none: Record<PropertyKey, never>; // empty object {}
};

export type GeoDistanceSort = {
    [field: string]: SortOrder | geo.GeoDistanceUnit | {
        lat: number;
        lon: number;
    };
};

export type GeoSortQuery = {
    _geo_distance: GeoDistanceSort;
};

export type AnyQuerySort = GeoSortQuery;

export type ElasticsearchDSLResult = {
    query: ConstantScoreQuery | MatchAllQuery | MatchNoneQuery;
    sort?: AnyQuerySort | AnyQuerySort[];
};

export type ESFieldType
    = | 'long'
        | 'integer'
        | 'short'
        | 'byte'
        | 'double'
        | 'float'
        | 'keyword'
        | 'text'
        | 'boolean'
        | 'ip'
        | 'ip_range'
        | 'date'
        | 'geo_point'
        | 'geo_shape'
        | 'object'
        | 'nested'
        | 'knn_vector';

export type ESTypeMapping
    = | PropertyESTypeMapping
        | FieldsESTypeMapping
        | BasicESTypeMapping
        | IgnoredESTypeMapping;

type BasicESTypeMapping = {
    type: ESFieldType;
    [prop: string]: any;
};

type IgnoredESTypeMapping = {
    enabled: boolean;
    [prop: string]: any;
};

type FieldsESTypeMapping = {
    type: ESFieldType | string;
    fields: {
        [key: string]: {
            type: ESFieldType | string;
            index?: boolean | string;
            analyzer?: string;
        };
    };
    [prop: string]: any;
};

export type PropertyESTypes = FieldsESTypeMapping | BasicESTypeMapping;
export type PropertyESTypeMapping = {
    type?: 'nested' | 'object';
    properties: {
        [key: string]: PropertyESTypes;
    };
};

export interface ESTypeMappings {
    [prop: string]: any;
    _all?: {
        enabled?: boolean;
        [key: string]: any;
    };
    _meta?: Record<string, any>;
    dynamic?: boolean;
    properties: {
        [key: string]: ESTypeMapping;
    };
}

export interface ESMapping {
    mappings: {
        [typeName: string]: ESTypeMappings;
    };
    template?: string;
    order?: number;
    aliases?: any;
    index_patterns?: string[];
    settings?: ESIndexSettings;
    version?: number;
}

export interface ESIndexSettings {
    'index.number_of_shards'?: number | string;
    'index.number_of_replicas'?: number | string;
    'index.refresh_interval'?: string;
    'index.max_result_window'?: number | string;
    analysis?: {
        analyzer?: {
            [key: string]: any;
        };
        tokenizer?: {
            [key: string]: any;
        };
    };
    [setting: string]: any;
}

export enum ElasticsearchDistribution {
    opensearch = 'opensearch',
    elasticsearch = 'elasticsearch'
}

export interface ClientMetadata {
    distribution: ElasticsearchDistribution;
    version: string;
    majorVersion: number;
    minorVersion: number;
}

export type Duration = number;
export type TimeUnit = 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';

export type TimeSpan = `${Duration}${TimeUnit}`;

export type ExpandWildcards = 'open' | 'closed' | 'hidden' | 'none' | 'all';

export type SearchTypes = 'query_then_fetch' | 'dfs_query_then_fetch';

export type SuggestMode = 'missing' | 'popular' | 'always';

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

export interface SearchResult<TDocument = Record<string, any>> {
    fields?: Record<string, any>;
    found: boolean;
    _index: string;
    _type?: string;
    _score?: number;
    _id: string;
    _primary_term?: number;
    _routing?: string;
    _seq_no?: number;
    _source?: TDocument;
    _version?: number;
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
    _shards: ShardStatistics;
    _version: number;
    forced_refresh?: boolean;
    error?: ErrorCauseKeys;
}

export type WaitForActiveShardOptions = 'all';

export type WaitForActiveShards = number | WaitForActiveShardOptions;

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

export type NodeRole = 'cluster_manager' | 'master' | 'data' | 'client' | 'ingest' | 'voting_only' | 'remote_cluster_client' | 'coordinating_only';

export type NodeRoles = NodeRole[];

export interface IndexTemplateProperties {
    aliases?: { [alias: string]: Alias };
    mappings?: Record<string, any>;
    settings?: Record<string, any>;
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

export interface MGetBody {
    docs?: MGetDocs[];
    ids?: string[];
}

export interface MGetDocs {
    _id: string;
    _index?: string;
    _type?: string;
    _source?: boolean;
    routing?: string;
    source_includes?: string | string[];
    source_excludes?: string | string[];
    _stored_fields?: string | string[];
}

export type BulkCreateOperation = BulkOperation;

export type BulkCreateResponseItem = BulkResponseItemBase;

export type BulkDeleteOperation = BulkOperation;

export type BulkDeleteResponseItem = BulkResponseItemBase;

export type BulkIndexOperation = BulkOperation;

export type BulkIndexResponseItem = BulkResponseItemBase;

export interface BulkOperation {
    _id: string;
    _index: string;
    retry_on_conflict: number;
    routing: string;
    version: number;
    version_type: VersionType;
}

export interface BulkOperationContainer {
    index?: BulkIndexOperation;
    create?: BulkCreateOperation;
    update?: BulkUpdateOperation;
    delete?: BulkDeleteOperation;
}

export type SearchSourceConfig = boolean | SearchSourceFilter | string | string[];

export interface BulkUpdateAction<TDocument = unknown, TPartialDocument = unknown> {
    detect_noop?: boolean;
    doc?: TPartialDocument;
    doc_as_upsert?: boolean;
    script?: Script;
    scripted_upsert?: boolean;
    _source?: SearchSourceConfig;
    upsert?: TDocument;
}

export interface BulkResponseItemBase {
    _id?: string | null;
    _index: string;
    status: number;
    error?: ErrorCause;
    _primary_term?: number;
    result?: string;
    _seq_no?: number;
    _shards?: ShardStatistics;
    _version?: number;
    forced_refresh?: boolean;
    get?: InlineGet<Record<string, any>>;
}

export interface BulkResponseItemContainer {
    index?: BulkIndexResponseItem;
    create?: BulkCreateResponseItem;
    update?: BulkUpdateResponseItem;
    delete?: BulkDeleteResponseItem;
}

export type BulkUpdateOperation = BulkOperation;

export type BulkUpdateResponseItem = BulkResponseItemBase;

export interface CatIndicesIndicesRecord {
    health?: string;
    h?: string;
    status?: string;
    s?: string;
    index?: string;
    i?: string;
    idx?: string;
    uuid?: string;
    id?: string;
    pri?: string;
    p?: string;
    'shards.primary'?: string;
    shardsPrimary?: string;
    rep?: string;
    r?: string;
    'shards.replica'?: string;
    shardsReplica?: string;
    'docs.count'?: string;
    dc?: string;
    docsCount?: string;
    'docs.deleted'?: string;
    dd?: string;
    docsDeleted?: string;
    'creation.date'?: string;
    cd?: string;
    'creation.date.string'?: string;
    cds?: string;
    'store.size'?: string;
    ss?: string;
    storeSize?: string;
    'prstore.size'?: string;
    'completion.size'?: string;
    cs?: string;
    completionSize?: string;
    'prcompletion.size'?: string;
    'fielddata.memory_size'?: string;
    fm?: string;
    fielddataMemory?: string;
    'prfielddata.memory_size'?: string;
    'fielddata.evictions'?: string;
    fe?: string;
    fielddataEvictions?: string;
    'prfielddata.evictions'?: string;
    'query_cache.memory_size'?: string;
    qcm?: string;
    queryCacheMemory?: string;
    'prquery_cache.memory_size'?: string;
    'query_cache.evictions'?: string;
    qce?: string;
    queryCacheEvictions?: string;
    'prquery_cache.evictions'?: string;
    'request_cache.memory_size'?: string;
    rcm?: string;
    requestCacheMemory?: string;
    'prrequest_cache.memory_size'?: string;
    'request_cache.evictions'?: string;
    rce?: string;
    requestCacheEvictions?: string;
    'prrequest_cache.evictions'?: string;
    'request_cache.hit_count'?: string;
    rchc?: string;
    requestCacheHitCount?: string;
    'prrequest_cache.hit_count'?: string;
    'request_cache.miss_count'?: string;
    rcmc?: string;
    requestCacheMissCount?: string;
    'prrequest_cache.miss_count'?: string;
    'flush.total'?: string;
    ft?: string;
    flushTotal?: string;
    'prflush.total'?: string;
    'flush.total_time'?: string;
    ftt?: string;
    flushTotalTime?: string;
    'prflush.total_time'?: string;
    'get.current'?: string;
    gc?: string;
    getCurrent?: string;
    'prget.current'?: string;
    'get.time'?: string;
    gti?: string;
    getTime?: string;
    'prget.time'?: string;
    'get.total'?: string;
    gto?: string;
    getTotal?: string;
    'prget.total'?: string;
    'get.exists_time'?: string;
    geti?: string;
    getExistsTime?: string;
    'prget.exists_time'?: string;
    'get.exists_total'?: string;
    geto?: string;
    getExistsTotal?: string;
    'prget.exists_total'?: string;
    'get.missing_time'?: string;
    gmti?: string;
    getMissingTime?: string;
    'prget.missing_time'?: string;
    'get.missing_total'?: string;
    gmto?: string;
    getMissingTotal?: string;
    'prget.missing_total'?: string;
    'indexing.delete_current'?: string;
    idc?: string;
    indexingDeleteCurrent?: string;
    'prindexing.delete_current'?: string;
    'indexing.delete_time'?: string;
    idti?: string;
    indexingDeleteTime?: string;
    'prindexing.delete_time'?: string;
    'indexing.delete_total'?: string;
    idto?: string;
    indexingDeleteTotal?: string;
    'prindexing.delete_total'?: string;
    'indexing.index_current'?: string;
    iic?: string;
    indexingIndexCurrent?: string;
    'prindexing.index_current'?: string;
    'indexing.index_time'?: string;
    iiti?: string;
    indexingIndexTime?: string;
    'prindexing.index_time'?: string;
    'indexing.index_total'?: string;
    iito?: string;
    indexingIndexTotal?: string;
    'prindexing.index_total'?: string;
    'indexing.index_failed'?: string;
    iif?: string;
    indexingIndexFailed?: string;
    'prindexing.index_failed'?: string;
    'merges.current'?: string;
    mc?: string;
    mergesCurrent?: string;
    'prmerges.current'?: string;
    'merges.current_docs'?: string;
    mcd?: string;
    mergesCurrentDocs?: string;
    'prmerges.current_docs'?: string;
    'merges.current_size'?: string;
    mcs?: string;
    mergesCurrentSize?: string;
    'prmerges.current_size'?: string;
    'merges.total'?: string;
    mt?: string;
    mergesTotal?: string;
    'prmerges.total'?: string;
    'merges.total_docs'?: string;
    mtd?: string;
    mergesTotalDocs?: string;
    'prmerges.total_docs'?: string;
    'merges.total_size'?: string;
    mts?: string;
    mergesTotalSize?: string;
    'prmerges.total_size'?: string;
    'merges.total_time'?: string;
    mtt?: string;
    mergesTotalTime?: string;
    'prmerges.total_time'?: string;
    'refresh.total'?: string;
    rto?: string;
    refreshTotal?: string;
    'prrefresh.total'?: string;
    'refresh.time'?: string;
    rti?: string;
    refreshTime?: string;
    'prrefresh.time'?: string;
    'refresh.external_total'?: string;
    reto?: string;
    'prrefresh.external_total'?: string;
    'refresh.external_time'?: string;
    reti?: string;
    'prrefresh.external_time'?: string;
    'refresh.listeners'?: string;
    rli?: string;
    refreshListeners?: string;
    'prrefresh.listeners'?: string;
    'search.fetch_current'?: string;
    sfc?: string;
    searchFetchCurrent?: string;
    'prsearch.fetch_current'?: string;
    'search.fetch_time'?: string;
    sfti?: string;
    searchFetchTime?: string;
    'prsearch.fetch_time'?: string;
    'search.fetch_total'?: string;
    sfto?: string;
    searchFetchTotal?: string;
    'prsearch.fetch_total'?: string;
    'search.open_contexts'?: string;
    so?: string;
    searchOpenContexts?: string;
    'prsearch.open_contexts'?: string;
    'search.query_current'?: string;
    sqc?: string;
    searchQueryCurrent?: string;
    'prsearch.query_current'?: string;
    'search.query_time'?: string;
    sqti?: string;
    searchQueryTime?: string;
    'prsearch.query_time'?: string;
    'search.query_total'?: string;
    sqto?: string;
    searchQueryTotal?: string;
    'prsearch.query_total'?: string;
    'search.scroll_current'?: string;
    scc?: string;
    searchScrollCurrent?: string;
    'prsearch.scroll_current'?: string;
    'search.scroll_time'?: string;
    scti?: string;
    searchScrollTime?: string;
    'prsearch.scroll_time'?: string;
    'search.scroll_total'?: string;
    scto?: string;
    searchScrollTotal?: string;
    'prsearch.scroll_total'?: string;
    'segments.count'?: string;
    sc?: string;
    segmentsCount?: string;
    'prsegments.count'?: string;
    'segments.memory'?: string;
    sm?: string;
    segmentsMemory?: string;
    'prsegments.memory'?: string;
    'segments.index_writer_memory'?: string;
    siwm?: string;
    segmentsIndexWriterMemory?: string;
    'prsegments.index_writer_memory'?: string;
    'segments.version_map_memory'?: string;
    svmm?: string;
    segmentsVersionMapMemory?: string;
    'prsegments.version_map_memory'?: string;
    'segments.fixed_bitset_memory'?: string;
    sfbm?: string;
    fixedBitsetMemory?: string;
    'prsegments.fixed_bitset_memory'?: string;
    'warmer.current'?: string;
    wc?: string;
    warmerCurrent?: string;
    'prwarmer.current'?: string;
    'warmer.total'?: string;
    wto?: string;
    warmerTotal?: string;
    'prwarmer.total'?: string;
    'warmer.total_time'?: string;
    wtt?: string;
    warmerTotalTime?: string;
    'prwarmer.total_time'?: string;
    'suggest.current'?: string;
    suc?: string;
    suggestCurrent?: string;
    'prsuggest.current'?: string;
    'suggest.time'?: string;
    suti?: string;
    suggestTime?: string;
    'prsuggest.time'?: string;
    'suggest.total'?: string;
    suto?: string;
    suggestTotal?: string;
    'prsuggest.total'?: string;
    'memory.total'?: string;
    tm?: string;
    memoryTotal?: string;
    'prmemory.total'?: string;
    'search.throttled'?: string;
    sth?: string;
    'bulk.total_operations'?: string;
    bto?: string;
    bulkTotalOperation?: string;
    'prbulk.total_operations'?: string;
    'bulk.total_time'?: string;
    btti?: string;
    bulkTotalTime?: string;
    'prbulk.total_time'?: string;
    'bulk.total_size_in_bytes'?: string;
    btsi?: string;
    bulkTotalSizeInBytes?: string;
    'prbulk.total_size_in_bytes'?: string;
    'bulk.avg_time'?: string;
    bati?: string;
    bulkAvgTime?: string;
    'prbulk.avg_time'?: string;
    'bulk.avg_size_in_bytes'?: string;
    basi?: string;
    bulkAvgSizeInBytes?: string;
    'prbulk.avg_size_in_bytes'?: string;
}

export interface ClusterHealthShardHealthStats {
    active_shards: number;
    initializing_shards: number;
    primary_active: boolean;
    relocating_shards: number;
    status: Health;
    unassigned_shards: number;
}

export interface ClusterHealthIndexHealthStats {
    active_primary_shards: number;
    active_shards: number;
    initializing_shards: number;
    number_of_replicas: number;
    number_of_shards: number;
    relocating_shards: number;
    shards?: Record<string, ClusterHealthShardHealthStats>;
    status: Health;
    unassigned_shards: number;
}

export interface IndicesGetFieldMappingTypeFieldMappings {
    mappings: Partial<Record<string, MappingFieldMapping>>;
}

export interface MappingFieldMapping {
    full_name: string;
    mapping: Partial<Record<string, MappingProperty>>;
}

export interface IndexTemplate {
    name: string;
    index_template: {
        index_patterns: string[];
        settings: { index: Record<string, any> };
        mappings: Record<string, any>;
        aliases: Alias;
    };
}

export interface IndicesGetMappingIndexMappingRecord {
    item?: MappingTypeMapping;
    mappings: MappingTypeMapping;
}

export interface IndicesIndexState {
    aliases?: Record<string, IndicesAlias>;
    mappings?: MappingTypeMapping;
    settings: IndicesIndexSettings | IndicesIndexStatePrefixedSettings;
    defaults?: IndicesIndexSettings | IndicesIndexStatePrefixedSettings;
}

export interface MappingTypeMapping {
    all_field?: MappingAllField;
    date_detection?: boolean;
    dynamic?: boolean | MappingDynamicMapping;
    dynamic_date_formats?: string[];
    dynamic_templates?:
        | Record<string, MappingDynamicTemplate>
        | Record<string, MappingDynamicTemplate>[];
    _field_names?: {
        enabled: boolean;
    };
    index_field?: {
        enabled: boolean;
    };
    _meta?: Record<string, unknown>;
    numeric_detection?: boolean;
    properties?: Record<string, MappingProperty>;
    _routing?: {
        required: boolean;
    };
    _size?: {
        enabled: boolean;
    };
    _source?: {
        compress?: boolean;
        compress_threshold?: string;
        enabled: boolean;
        excludes?: string[];
        includes?: string[];
    };
    runtime?: Record<string, MappingRuntimeField>;
}

export interface MappingRuntimeField {
    format?: string;
    script?: Script;
    type: MappingRuntimeFieldType;
}

export type MappingRuntimeFieldType
    = | 'boolean'
        | 'date'
        | 'number'
        | 'geo_point'
        | 'ip'
        | 'keyword'
        | 'long';

export interface MappingDynamicTemplate {
    mapping?: MappingPropertyBase;
    match?: string;
    match_mapping_type?: string;
    match_pattern?: MappingMatchType;
    path_match?: string;
    path_unmatch?: string;
    unmatch?: string;
}

export interface MappingPropertyBase {
    local_metadata?: Record<string, any>;
    meta?: Record<string, string>;
    name?: string;
    properties?: Record<string, MappingProperty>;
    ignore_above?: number;
    dynamic?: boolean | MappingDynamicMapping;
    fields?: Record<string, MappingProperty>;
}

export type MappingProperty
    = | MappingFlattenedProperty
        | MappingJoinProperty
        | MappingPercolatorProperty
        | MappingRankFeatureProperty
        | MappingRankFeaturesProperty
        | MappingConstantKeywordProperty
        | MappingFieldAliasProperty
        | MappingHistogramProperty
        | MappingCoreProperty;

export interface MappingFlattenedProperty extends MappingPropertyBase {
    boost?: number;
    depth_limit?: number;
    doc_values?: boolean;
    eager_global_ordinals?: boolean;
    index?: boolean;
    index_options?: MappingIndexOptions;
    null_value?: string;
    similarity?: string;
    split_queries_on_whitespace?: boolean;
    type: 'flattened';
}

export type MappingCoreProperty
    = | MappingObjectProperty
        | MappingNestedProperty
        | MappingSearchAsYouTypeProperty
        | MappingTextProperty
        | MappingDocValuesProperty;

export type MappingDocValuesProperty
    = | MappingBinaryProperty
        | MappingBooleanProperty
        | MappingDateProperty
        | MappingDateNanosProperty
        | MappingKeywordProperty
        | MappingNumberProperty
        | MappingRangeProperty
        | MappingGeoPointProperty
        | MappingGeoShapeProperty
        | MappingCompletionProperty
        | MappingIpProperty
        | MappingMurmur3HashProperty
        | MappingShapeProperty
        | MappingTokenCountProperty
        | MappingVersionProperty
        | MappingWildcardProperty
        | MappingPointProperty;

export interface MappingBooleanProperty extends MappingDocValuesPropertyBase {
    boost?: number;
    fielddata?: IndicesNumericFielddata;
    index?: boolean;
    null_value?: boolean;
    type: 'boolean';
}

export interface IndicesNumericFielddata {
    format: IndicesNumericFielddataFormat;
}

export type IndicesNumericFielddataFormat = 'array' | 'disabled';

export interface MappingPointProperty extends MappingDocValuesPropertyBase {
    ignore_malformed?: boolean;
    ignore_z_value?: boolean;
    null_value?: string;
    type: 'point';
}

export interface MappingWildcardProperty extends MappingDocValuesPropertyBase {
    type: 'wildcard';
    null_value?: string;
}

export interface MappingVersionProperty extends MappingDocValuesPropertyBase {
    type: 'version';
}

export interface MappingTokenCountProperty extends MappingDocValuesPropertyBase {
    analyzer?: string;
    boost?: number;
    index?: boolean;
    null_value?: number;
    enable_position_increments?: boolean;
    type: 'token_count';
}

export interface MappingShapeProperty extends MappingDocValuesPropertyBase {
    coerce?: boolean;
    ignore_malformed?: boolean;
    ignore_z_value?: boolean;
    orientation?: MappingGeoOrientation;
    type: 'shape';
}

export type MappingGeoOrientation = 'right' | 'RIGHT' | 'counterclockwise' | 'ccw' | 'left' | 'LEFT' | 'clockwise' | 'cw';

export interface MappingMurmur3HashProperty extends MappingDocValuesPropertyBase {
    type: 'murmur3';
}

export interface MappingIpProperty extends MappingDocValuesPropertyBase {
    boost?: number;
    index?: boolean;
    null_value?: string;
    ignore_malformed?: boolean;
    type: 'ip';
}

export interface MappingCompletionProperty extends MappingDocValuesPropertyBase {
    analyzer?: string;
    contexts?: MappingSuggestContext[];
    max_input_length?: number;
    preserve_position_increments?: boolean;
    preserve_separators?: boolean;
    search_analyzer?: string;
    type: 'completion';
}

export interface MappingSuggestContext {
    name: string;
    path?: string;
    type: string;
    precision?: number | string;
}

export type MappingGeoStrategy = 'recursive' | 'term';

export interface MappingGeoShapeProperty extends MappingDocValuesPropertyBase {
    coerce?: boolean;
    ignore_malformed?: boolean;
    ignore_z_value?: boolean;
    orientation?: MappingGeoOrientation;
    strategy?: MappingGeoStrategy;
    type: 'geo_shape';
}

export interface MappingGeoPointProperty extends MappingDocValuesPropertyBase {
    ignore_malformed?: boolean;
    ignore_z_value?: boolean;
    null_value?: GeoLocation;
    type: 'geo_point';
}

export type GeoLocation = LatLonGeoLocation | GeoHashLocation | number[] | string;

export interface LatLonGeoLocation {
    lat: number;
    lon: number;
}

export type GeoHash = string;

export interface GeoHashLocation {
    geohash: GeoHash;
}

export interface MappingLongRangeProperty extends MappingRangePropertyBase {
    type: 'long_range';
}

export interface MappingIpRangeProperty extends MappingRangePropertyBase {
    type: 'ip_range';
}

export interface MappingRangePropertyBase extends MappingDocValuesPropertyBase {
    boost?: number;
    coerce?: boolean;
    index?: boolean;
}

export interface MappingIntegerRangeProperty extends MappingRangePropertyBase {
    type: 'integer_range';
}

export interface MappingDoubleRangeProperty extends MappingRangePropertyBase {
    type: 'double_range';
}

export type MappingRangeProperty
    = | MappingLongRangeProperty
        | MappingIpRangeProperty
        | MappingIntegerRangeProperty
        | MappingFloatRangeProperty
        | MappingDoubleRangeProperty
        | MappingDateRangeProperty;

export type MappingNumberProperty
    = | MappingFloatNumberProperty
        | MappingHalfFloatNumberProperty
        | MappingDoubleNumberProperty
        | MappingIntegerNumberProperty
        | MappingLongNumberProperty
        | MappingShortNumberProperty
        | MappingByteNumberProperty
        | MappingUnsignedLongNumberProperty
        | MappingScaledFloatNumberProperty;

export interface MappingFloatNumberProperty extends MappingStandardNumberProperty {
    type: 'float';
    null_value?: number;
}

export interface MappingNumberPropertyBase extends MappingDocValuesPropertyBase {
    index?: boolean;
    ignore_malformed?: boolean;
    time_series_metric?: MappingTimeSeriesMetricType;
}

export type MappingTimeSeriesMetricType = 'gauge' | 'counter' | 'summary' | 'histogram';

export interface MappingStandardNumberProperty extends MappingNumberPropertyBase {
    coerce?: boolean;
    script?: Script;
    on_script_error?: MappingOnScriptError;
}

export type MappingOnScriptError = 'fail' | 'continue';

export interface MappingScaledFloatNumberProperty extends MappingNumberPropertyBase {
    type: 'scaled_float';
    coerce?: boolean;
    null_value?: number;
    scaling_factor?: number;
}

export interface MappingUnsignedLongNumberProperty extends MappingNumberPropertyBase {
    type: 'unsigned_long';
    null_value?: number;
}

export interface MappingByteNumberProperty extends MappingStandardNumberProperty {
    type: 'byte';
    null_value?: number;
}

export interface MappingShortNumberProperty extends MappingStandardNumberProperty {
    type: 'short';
    null_value?: number;
}

export interface MappingLongNumberProperty extends MappingStandardNumberProperty {
    type: 'long';
    null_value?: number;
}

export interface MappingIntegerNumberProperty extends MappingStandardNumberProperty {
    type: 'integer';
    null_value?: number;
}

export interface MappingDoubleNumberProperty extends MappingStandardNumberProperty {
    type: 'double';
    null_value?: number;
}

export interface MappingHalfFloatNumberProperty extends MappingStandardNumberProperty {
    type: 'half_float';
    null_value?: number;
}

export interface MappingKeywordProperty extends MappingDocValuesPropertyBase {
    boost?: number;
    eager_global_ordinals?: boolean;
    index?: boolean;
    index_options?: MappingIndexOptions;
    normalizer?: string;
    norms?: boolean;
    null_value?: string;
    split_queries_on_whitespace?: boolean;
    time_series_dimension?: boolean;
    type: 'keyword';
}

export interface MappingDateNanosProperty extends MappingDocValuesPropertyBase {
    boost?: number;
    format?: string;
    ignore_malformed?: boolean;
    index?: boolean;
    null_value?: string;
    precision_step?: number;
    type: 'date_nanos';
}

export interface MappingDateProperty extends MappingDocValuesPropertyBase {
    boost?: number;
    fielddata?: IndicesNumericFielddata;
    format?: string;
    ignore_malformed?: boolean;
    index?: boolean;
    null_value?: string;
    precision_step?: number;
    locale?: string;
    type: 'date';
}

export interface MappingDateRangeProperty extends MappingRangePropertyBase {
    format?: string;
    type: 'date_range';
}

export interface MappingBinaryProperty extends MappingDocValuesPropertyBase {
    type: 'binary';
}

export interface MappingObjectProperty extends MappingCorePropertyBase {
    enabled?: boolean;
    type?: 'object';
}

export interface MappingDocValuesPropertyBase extends MappingCorePropertyBase {
    doc_values?: boolean;
}

export interface MappingTextProperty extends MappingCorePropertyBase {
    analyzer?: string;
    boost?: number;
    eager_global_ordinals?: boolean;
    fielddata?: boolean;
    fielddata_frequency_filter?: IndicesFielddataFrequencyFilter;
    index?: boolean;
    index_options?: MappingIndexOptions;
    index_phrases?: boolean;
    index_prefixes?: MappingTextIndexPrefixes;
    norms?: boolean;
    position_increment_gap?: number;
    search_analyzer?: string;
    search_quote_analyzer?: string;
    term_vector?: MappingTermVectorOption;
    type: 'text';
}

export type MappingTermVectorOption = 'no' | 'yes' | 'with_offsets' | 'with_positions' | 'with_positions_offsets' | 'with_positions_offsets_payloads' | 'with_positions_payloads';

export interface MappingTextIndexPrefixes {
    max_chars: number;
    min_chars: number;
}

export interface IndicesFielddataFrequencyFilter {
    max: number;
    min: number;
    min_segment_size: number;
}

export interface MappingSearchAsYouTypeProperty extends MappingCorePropertyBase {
    analyzer?: string;
    index?: boolean;
    index_options?: MappingIndexOptions;
    max_shingle_size?: number;
    norms?: boolean;
    search_analyzer?: string;
    search_quote_analyzer?: string;
    term_vector?: MappingTermVectorOption;
    type: 'search_as_you_type';
}

export interface MappingCorePropertyBase extends MappingPropertyBase {
    copy_to?: string | string[];
    similarity?: string;
    store?: boolean;
}

export type MappingIndexOptions = 'docs' | 'freqs' | 'positions' | 'offsets';

export interface MappingNestedProperty extends MappingCorePropertyBase {
    enabled?: boolean;
    include_in_parent?: boolean;
    include_in_root?: boolean;
    type: 'nested';
}

export interface MappingHistogramProperty extends MappingPropertyBase {
    ignore_malformed?: boolean;
    type: 'histogram';
}

export interface MappingFieldAliasProperty extends MappingPropertyBase {
    path?: string;
    type: 'alias';
}

export interface MappingConstantKeywordProperty extends MappingPropertyBase {
    value?: any;
    type: 'constant_keyword';
}

export interface MappingRankFeatureProperty extends MappingPropertyBase {
    positive_score_impact?: boolean;
    type: 'rank_feature';
}

export interface MappingRankFeaturesProperty extends MappingPropertyBase {
    type: 'rank_features';
}

export interface MappingPercolatorProperty extends MappingPropertyBase {
    type: 'percolator';
}

export interface MappingJoinProperty extends MappingPropertyBase {
    relations?: Record<string, string | string[]>;
    type: 'join';
}

export interface MappingFloatRangeProperty extends MappingRangePropertyBase {
    type: 'float_range';
}

export type MappingMatchType = 'simple' | 'regex';

export type MappingDynamicMapping = 'strict' | 'runtime' | 'true' | 'false';

export interface MappingAllField {
    analyzer: string;
    enabled: boolean;
    omit_norms: boolean;
    search_analyzer: string;
    similarity: string;
    store: boolean;
    store_term_vector_offsets: boolean;
    store_term_vector_payloads: boolean;
    store_term_vector_positions: boolean;
    store_term_vectors: boolean;
}

export interface IndicesAlias {
    filter?: Record<string, any>;
    index_routing?: string;
    is_hidden?: boolean;
    is_write_index?: boolean;
    routing?: string;
    search_routing?: string;
}

export interface IndicesIndexStatePrefixedSettings {
    index: IndicesIndexSettings;
}

export interface TemplateBody extends IndexTemplateProperties {
    version?: number;
    order?: number;
}

export type MappingRuntimeFields = Record<string, MappingRuntimeField>;

export interface MappingRoutingField {
    required: boolean;
}

export interface MappingSourceField {
    compress?: boolean;
    compress_threshold?: string;
    enabled: boolean;
    excludes?: string[];
    includes?: string[];
}

export interface MappingSizeField {
    enabled: boolean;
}

export interface MappingIndexField {
    enabled: boolean;
}

export interface MappingFieldNamesField {
    enabled: boolean;
}

export interface IndicesResponseBase {
    _shards?: ShardStatistics;
    acknowledged: boolean;
}

export interface IndicesPutMappingTypeFieldMappings {
    mappings: Partial<Record<string, MappingFieldMapping>>;
}

export interface IndicesPutSettingsIndexSettingsBody extends IndicesIndexSettings {
    settings?: IndicesIndexSettings;
}

export type IndicesIndexCheckOnStartup = 'false' | 'checksum' | 'true';

export interface IndicesIndexSettings {
    number_of_shards?: number | string;
    'index.number_of_shards'?: number | string;
    number_of_replicas?: number | string;
    'index.number_of_replicas'?: number | string;
    number_of_routing_shards?: number;
    'index.number_of_routing_shards'?: number;
    check_on_startup?: IndicesIndexCheckOnStartup;
    'index.check_on_startup'?: IndicesIndexCheckOnStartup;
    codec?: string;
    'index.codec'?: string;
    routing_partition_size?: number | string;
    'index.routing_partition_size'?: number | string;
    'soft_deletes.retention_lease.period'?: number | string;
    'index.soft_deletes.retention_lease.period'?: number | string;
    load_fixed_bitset_filters_eagerly?: boolean;
    'index.load_fixed_bitset_filters_eagerly'?: boolean;
    hidden?: boolean | string;
    'index.hidden'?: boolean | string;
    auto_expand_replicas?: string;
    'index.auto_expand_replicas'?: string;
    'search.idle.after'?: number | string;
    'index.search.idle.after'?: number | string;
    refresh_interval?: number | string;
    'index.refresh_interval'?: number | string;
    max_result_window?: number;
    'index.max_result_window'?: number;
    max_inner_result_window?: number;
    'index.max_inner_result_window'?: number;
    max_rescore_window?: number;
    'index.max_rescore_window'?: number;
    max_docvalue_fields_search?: number;
    'index.max_docvalue_fields_search'?: number;
    max_script_fields?: number;
    'index.max_script_fields'?: number;
    max_ngram_diff?: number;
    'index.max_ngram_diff'?: number;
    max_shingle_diff?: number;
    'index.max_shingle_diff'?: number;
    blocks?: IndicesIndexSettingBlocks;
    'index.blocks'?: IndicesIndexSettingBlocks;
    max_refresh_listeners?: number;
    'index.max_refresh_listeners'?: number;
    'analyze.max_token_count'?: number;
    'index.analyze.max_token_count'?: number;
    'highlight.max_analyzed_offset'?: number;
    'index.highlight.max_analyzed_offset'?: number;
    max_terms_count?: number;
    'index.max_terms_count'?: number;
    max_regex_length?: number;
    'index.max_regex_length'?: number;
    routing?: IndicesIndexRouting;
    'index.routing'?: IndicesIndexRouting;
    gc_deletes?: number | string;
    'index.gc_deletes'?: number | string;
    default_pipeline?: string;
    'index.default_pipeline'?: string;
    final_pipeline?: string;
    'index.final_pipeline'?: string;
    lifecycle?: IndicesIndexSettingsLifecycle;
    'index.lifecycle'?: IndicesIndexSettingsLifecycle;
    provided_name?: string;
    'index.provided_name'?: string;
    creation_date?: string;
    'index.creation_date'?: string;
    uuid?: string;
    'index.uuid'?: string;
    version?: IndicesIndexVersioning;
    'index.version'?: IndicesIndexVersioning;
    verified_before_close?: boolean | string;
    'index.verified_before_close'?: boolean | string;
    format?: string | number;
    'index.format'?: string | number;
    max_slices_per_scroll?: number;
    'index.max_slices_per_scroll'?: number;
    'translog.durability'?: string;
    'index.translog.durability'?: string;
    'query_string.lenient'?: boolean | string;
    'index.query_string.lenient'?: boolean | string;
    priority?: number | string;
    'index.priority'?: number | string;
    top_metrics_max_size?: number;
    analysis?: IndicesIndexSettingsAnalysis;
}

export interface IndicesIndexSettingsLifecycle {
    name: string;
}

export interface IndicesIndexVersioning {
    created: string;
}

export interface IndicesIndexSettingBlocks {
    read_only?: boolean;
    'index.blocks.read_only'?: boolean;
    read_only_allow_delete?: boolean;
    'index.blocks.read_only_allow_delete'?: boolean;
    read?: boolean;
    'index.blocks.read'?: boolean;
    write?: boolean | string;
    'index.blocks.write'?: boolean | string;
    metadata?: boolean;
    'index.blocks.metadata'?: boolean;
}

export interface IndicesIndexSettingsAnalysis {
    char_filter?: Record<string, AnalysisCharFilter>;
}

export type AnalysisCharFilter
    = | AnalysisHtmlStripCharFilter
        | AnalysisMappingCharFilter
        | AnalysisPatternReplaceTokenFilter;

export type AnalysisHtmlStripCharFilter = AnalysisCharFilterBase;

export interface AnalysisMappingCharFilter extends AnalysisCharFilterBase {
    mappings: string[];
    mappings_path: string;
}

export interface AnalysisPatternReplaceTokenFilter extends AnalysisTokenFilterBase {
    flags: string;
    pattern: string;
    replacement: string;
}

export interface AnalysisTokenFilterBase {
    type: string;
    version?: string;
}

export interface AnalysisCharFilterBase {
    type: string;
    version?: string;
}

export interface DictionaryResponseBase<TValue = unknown> {
    [key: string]: TValue;
}

export interface IndicesRecoveryRecoveryStatus {
    shards: IndicesRecoveryShardRecovery[];
}

export interface IndicesRecoveryRecoveryBytes {
    percent: string | number;
    recovered?: string | number;
    recovered_in_bytes: string | number;
    reused?: string | number;
    reused_in_bytes: string | number;
    total?: string | number;
    total_in_bytes: string | number;
}

export interface IndicesRecoveryRecoveryFiles {
    details?: IndicesRecoveryFileDetails[];
    percent: string | number;
    recovered: number;
    reused: number;
    total: number;
}

export interface IndicesRecoveryFileDetails {
    length: number;
    name: string;
    recovered: number;
}

export interface IndicesRecoveryRecoveryIndexStatus {
    bytes?: IndicesRecoveryRecoveryBytes;
    files: IndicesRecoveryRecoveryFiles;
    size: IndicesRecoveryRecoveryBytes;
    source_throttle_time?: string | number;
    source_throttle_time_in_millis: string | number;
    target_throttle_time?: string | number;
    target_throttle_time_in_millis: string | number;
    total_time_in_millis: string | number;
    total_time?: string | number;
}

export interface IndicesRecoveryShardRecovery {
    id: number;
    index: IndicesRecoveryRecoveryIndexStatus;
    primary: boolean;
    source: IndicesRecoveryRecoveryOrigin;
    stage: string;
    start?: IndicesRecoveryRecoveryStartStatus;
    start_time?: string;
    start_time_in_millis: string | number;
    stop_time?: string;
    stop_time_in_millis: string | number;
    target: IndicesRecoveryRecoveryOrigin;
    total_time?: string;
    total_time_in_millis: string | number;
    translog: IndicesRecoveryTranslogStatus;
    type: string;
    verify_index: IndicesRecoveryVerifyIndex;
}

export interface IndicesRecoveryRecoveryOrigin {
    hoststring?: string;
    host?: string;
    transport_address?: string;
    id?: string;
    ip?: string;
    string?: string;
    bootstrap_new_history_string?: boolean;
    repository?: string;
    snapshot?: string;
    version?: string;
    restorestring?: string;
    index?: string;
}

export interface IndicesRecoveryVerifyIndex {
    check_index_time?: string | number;
    check_index_time_in_millis: string | number;
    total_time?: string | number;
    total_time_in_millis: string | number;
}

export interface IndicesRecoveryTranslogStatus {
    percent: string | number;
    recovered: number;
    total: number;
    total_on_start: number;
    total_time?: string;
    total_time_in_millis: string | number;
}

export interface IndicesRecoveryRecoveryStartStatus {
    check_index_time: number;
    total_time_in_millis: string;
}

export interface IndicesValidateQueryIndicesValidationExplanation {
    error?: string;
    explanation?: string;
    index: string;
    valid: boolean;
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

export interface IndividualResponse<T> extends SearchRecordResponse<T> {
    status: number;
}

export interface SearchRecordResponse<T = Record<string, unknown>> {
    took: number;
    timed_out: boolean;
    _scroll_id?: string;
    terminated_early?: boolean;
    max_score?: number;
    fields?: Record<string, any>;
    aggregations?: SearchAggregations;
    _shards: {
        total: number;
        successful: number;
        skipped: number;
        failed: number;
    };
    hits: {
        total: number | HitsTotal;
        max_score: number;
        hits: SearchResult<T>[];
    };
}

export type SearchAggregations = Record<string, AggregationsAggregate>;

export interface NodesInfoNodeInfoHttp {
    bound_address: string[];
    max_content_length?: number | string;
    max_content_length_in_bytes: number;
    publish_address: string;
}

export interface NodesInfoNodeInfoJvmMemory {
    direct_max?: number | string;
    direct_max_in_bytes: number;
    heap_init?: number | string;
    heap_init_in_bytes: number;
    heap_max?: number | string;
    heap_max_in_bytes: number;
    non_heap_init?: number | string;
    non_heap_init_in_bytes: number;
    non_heap_max?: number | string;
    non_heap_max_in_bytes: number;
}

export interface NodesInfoNodeJvmInfo {
    gc_collectors: string[];
    mem: NodesInfoNodeInfoJvmMemory;
    memory_pools: string[];
    pid: number;
    start_time_in_millis: number;
    version: string;
    vm_name: string;
    vm_vendor: string;
    vm_version: string;
    bundled_jdk: boolean;
    using_bundled_jdk: boolean;
    using_compressed_ordinary_object_pointers?: boolean | string;
    input_arguments: string[];
}

export interface NodesInfoNodeInfoNetwork {
    primary_interface: NodesInfoNodeInfoNetworkInterface;
    refresh_interval: number;
}

export interface NodesInfoNodeInfoNetworkInterface {
    address: string;
    mac_address: string;
    name: string;
}

export interface NodesInfoNodeOperatingSystemInfo {
    arch: string;
    available_processors: number;
    allocated_processors?: number;
    name: string;
    pretty_name: string;
    refresh_interval_in_millis: number;
    version: string;
    cpu?: NodesInfoNodeInfoOSCPU;
    mem?: NodesInfoNodeInfoMemory;
    swap?: NodesInfoNodeInfoMemory;
}

export interface NodesInfoNodeInfoMemory {
    total: string;
    total_in_bytes: number;
}

export interface NodesInfoNodeInfoOSCPU {
    cache_size: string;
    cache_size_in_bytes: number;
    cores_per_socket: number;
    mhz: number;
    model: string;
    total_cores: number;
    total_sockets: number;
    vendor: string;
}

export interface NodesInfoNodeProcessInfo {
    id: number;
    mlockall: boolean;
    refresh_interval_in_millis: number;
}

export interface NodesInfoNodeThreadPoolInfo {
    core?: number;
    keep_alive?: string;
    max?: number;
    queue_size: number;
    size?: number;
    type: string;
}

export interface NodesInfoNodeInfo {
    attributes: Record<string, string>;
    build_hash: string;
    build_type: string;
    host: string;
    http?: NodesInfoNodeInfoHttp;
    ip: string;
    jvm?: NodesInfoNodeJvmInfo;
    name: string;
    network?: NodesInfoNodeInfoNetwork;
    os?: NodesInfoNodeOperatingSystemInfo;
    plugins?: PluginStats[];
    process?: NodesInfoNodeProcessInfo;
    roles: NodeRoles;
    settings?: NodesInfoNodeInfoSettings;
    thread_pool?: Record<string, NodesInfoNodeThreadPoolInfo>;
    total_indexing_buffer?: number;
    total_indexing_buffer_in_bytes?: number | string;
    transport?: NodesInfoNodeInfoTransport;
    transport_address: string;
    version: string;
    modules?: PluginStats[];
    ingest?: NodesInfoNodeInfoIngest;
    aggregations?: Record<string, NodesInfoNodeInfoAggregation>;
}

export interface NodesInfoNodeInfoAggregation {
    types: string[];
}

export interface NodesInfoNodeInfoIngest {
    processors: NodesInfoNodeInfoIngestProcessor[];
}

export interface NodesInfoNodeInfoIngestProcessor {
    type: string;
}

export interface NodesInfoNodeInfoSettingsCluster {
    name: string;
    routing?: IndicesIndexRouting;
    election: NodesInfoNodeInfoSettingsClusterElection;
    initial_cluster_manager_nodes?: string;
    initial_master_nodes?: string;
}

export interface IndicesIndexRoutingAllocation {
    enable?: IndicesIndexRoutingAllocationOptions;
    include?: IndicesIndexRoutingAllocationInclude;
    initial_recovery?: IndicesIndexRoutingAllocationInitialRecovery;
    disk?: IndicesIndexRoutingAllocationDisk;
}

export interface IndicesIndexRoutingAllocationDisk {
    threshold_enabled: boolean | string;
}

export interface IndicesIndexRoutingAllocationInclude {
    _tier_preference?: string;
    _id?: string;
}

export interface IndicesIndexRoutingAllocationInitialRecovery {
    _id?: string;
}

export type IndicesIndexRoutingAllocationOptions = 'all' | 'primaries' | 'new_primaries' | 'none';

export interface IndicesIndexRoutingRebalance {
    enable: IndicesIndexRoutingRebalanceOptions;
}

export type IndicesIndexRoutingRebalanceOptions = 'all' | 'primaries' | 'replicas' | 'none';

export interface IndicesIndexRouting {
    allocation?: IndicesIndexRoutingAllocation;
    rebalance?: IndicesIndexRoutingRebalance;
}

export interface NodesInfoNodeInfoSettingsClusterElection {
    strategy: string;
}

export interface NodesInfoNodeInfoSettingsHttp {
    type: string | NodesInfoNodeInfoSettingsHttpType;
    'type.default'?: string;
    compression?: boolean | string;
    port?: number | string;
}

export interface NodesInfoNodeInfoSettingsHttpType {
    default: string;
}

export interface NodesInfoNodeInfoSettingsNetwork {
    host: string;
}

export interface NodesInfoNodeInfoSettingsNode {
    name: string;
    attr: Record<string, any>;
    max_local_storage_nodes?: string;
}

export interface NodesInfoNodeInfoSettingsTransport {
    type: string | NodesInfoNodeInfoSettingsTransportType;
    'type.default'?: string;
    features?: Record<string, any>;
}

export interface NodesInfoNodeInfoSettingsTransportType {
    default: string;
}

export interface NodesInfoNodeInfoTransport {
    bound_address: string[];
    publish_address: string;
    profiles: Record<string, string>;
}

export interface NodesInfoNodeInfoSettings {
    cluster: NodesInfoNodeInfoSettingsCluster;
    node: NodesInfoNodeInfoSettingsNode;
    path: NodesInfoNodeInfoPath;
    repositories?: NodesInfoNodeInfoRepositories;
    discovery?: NodesInfoNodeInfoDiscover;
    action?: NodesInfoNodeInfoAction;
    client: NodesInfoNodeInfoClient;
    http: NodesInfoNodeInfoSettingsHttp;
    bootstrap?: NodesInfoNodeInfoBootstrap;
    transport: NodesInfoNodeInfoSettingsTransport;
    network?: NodesInfoNodeInfoSettingsNetwork;
    script?: NodesInfoNodeInfoScript;
    search?: NodesInfoNodeInfoSearch;
}

export interface NodesInfoNodeInfoSearch {
    remote: NodesInfoNodeInfoSearchRemote;
}

export interface NodesInfoNodeInfoSearchRemote {
    connect: string;
}

export interface NodesInfoNodeInfoScript {
    allowed_types: string;
    disable_max_compilations_rate: string;
}

export interface NodesInfoNodeInfoBootstrap {
    memory_lock: string;
}

export interface NodesInfoNodeInfoDiscover {
    seed_hosts: string;
}

export interface NodesInfoNodeInfoClient {
    type: string;
}

export interface NodesInfoNodeInfoAction {
    destructive_requires_name: string;
}

export interface NodesInfoNodeInfoPath {
    logs: string;
    home: string;
    repo: string[];
    data?: string[];
}

export interface NodesInfoNodeInfoRepositories {
    url: NodesInfoNodeInfoRepositoriesUrl;
}

export interface NodesInfoNodeInfoRepositoriesUrl {
    allowed_urls: string;
}

export type Level = 'cluster' | 'indices' | 'shards';

export type Metrics = string | string[];

export interface NodeStatistics {
    failures?: ErrorCause[];
    total: number;
    successful: number;
    failed: number;
}

export interface NodesStats {
    adaptive_selection: Record<string, NodesAdaptiveSelection>;
    breakers: Record<string, NodesBreaker>;
    fs: NodesFileSystem;
    host: string;
    http: string;
    indices: IndicesStatsIndexStats;
    ingest: NodesIngest;
    ip: string | string[];
    jvm: NodesJvm;
    name: string;
    os: NodesOperatingSystem;
    process: NodesProcess;
    roles: NodeRoles;
    script: NodesScripting;
    thread_pool: Record<string, NodesThreadCount>;
    timestamp: number;
    transport: NodesTransport;
    transport_address: string;
    attributes: Record<string, string>;
}

export interface NodesTransport {
    rx_count: number;
    rx_size: string;
    rx_size_in_bytes: number;
    server_open: number;
    tx_count: number;
    tx_size: string;
    tx_size_in_bytes: number;
}

export interface NodesThreadCount {
    active: number;
    completed: number;
    largest: number;
    queue: number;
    rejected: number;
    threads: number;
}

export interface IndicesStatsIndexStats {
    completion?: CompletionStats;
    docs: DocStats;
    fielddata?: FielddataStats;
    flush?: FlushStats;
    get?: GetStats;
    indexing?: IndexingStats;
    merges?: MergesStats;
    query_cache?: QueryCacheStats;
    recovery?: RecoveryStats;
    refresh?: RefreshStats;
    request_cache?: RequestCacheStats;
    search?: SearchStats;
    segments?: SegmentsStats;
    store?: StoreStats;
    translog?: TranslogStats;
    warmer?: WarmerStats;
    bulk?: BulkStats;
}

export interface StoreStats {
    size?: number | string;
    size_in_bytes: number;
    reserved?: number | string;
    reserved_in_bytes: number;
    total_data_set_size?: number | string;
    total_data_set_size_in_bytes?: number;
}

export interface BulkStats {
    total_operations: number;
    total_time?: string;
    total_time_in_millis: number;
    total_size?: number | string;
    total_size_in_bytes: number;
    avg_time?: string;
    avg_time_in_millis: number;
    avg_size?: number | string;
    avg_size_in_bytes: number;
}

export interface WarmerStats {
    current: number;
    total: number;
    total_time?: string;
    total_time_in_millis: number;
}

export interface TranslogStats {
    earliest_last_modified_age: number;
    operations: number;
    size?: string;
    size_in_bytes: number;
    uncommitted_operations: number;
    uncommitted_size?: string;
    uncommitted_size_in_bytes: number;
}

export interface SegmentsStats {
    count: number;
    doc_values_memory?: number | string;
    doc_values_memory_in_bytes: number;
    file_sizes: Record<string, IndicesStatsShardFileSizeInfo>;
    fixed_bit_set?: number | string;
    fixed_bit_set_memory_in_bytes: number;
    index_writer_memory?: number | string;
    index_writer_max_memory_in_bytes?: number;
    index_writer_memory_in_bytes: number;
    max_unsafe_auto_id_timestamp: number;
    memory?: number | string;
    memory_in_bytes: number;
    norms_memory?: number | string;
    norms_memory_in_bytes: number;
    points_memory?: number | string;
    points_memory_in_bytes: number;
    stored_memory?: number | string;
    stored_fields_memory_in_bytes: number;
    terms_memory_in_bytes: number;
    terms_memory?: number | string;
    term_vectory_memory?: number | string;
    term_vectors_memory_in_bytes: number;
    version_map_memory?: number | string;
    version_map_memory_in_bytes: number;
}

export interface IndicesStatsShardFileSizeInfo {
    description: string;
    size_in_bytes: number;
    min_size_in_bytes?: number;
    max_size_in_bytes?: number;
    average_size_in_bytes?: number;
    count?: number;
}

export interface SearchStats {
    fetch_current: number;
    fetch_time_in_millis: number;
    fetch_total: number;
    open_contexts?: number;
    query_current: number;
    query_time_in_millis: number;
    query_total: number;
    scroll_current: number;
    scroll_time_in_millis: number;
    scroll_total: number;
    suggest_current: number;
    suggest_time_in_millis: number;
    suggest_total: number;
    groups?: Record<string, SearchStats>;
}

export interface RequestCacheStats {
    evictions: number;
    hit_count: number;
    memory_size?: string;
    memory_size_in_bytes: number;
    miss_count: number;
}

export interface RecoveryStats {
    current_as_source: number;
    current_as_target: number;
    throttle_time?: string;
    throttle_time_in_millis: number;
}

export interface RefreshStats {
    external_total: number;
    external_total_time_in_millis: number;
    listeners: number;
    total: number;
    total_time?: string;
    total_time_in_millis: number;
}

export interface QueryCacheStats {
    cache_count: number;
    cache_size: number;
    evictions: number;
    hit_count: number;
    memory_size?: number | string;
    memory_size_in_bytes: number;
    miss_count: number;
    total_count: number;
}

export interface MergesStats {
    current: number;
    current_docs: number;
    current_size?: string;
    current_size_in_bytes: number;
    total: number;
    total_auto_throttle?: string;
    total_auto_throttle_in_bytes: number;
    total_docs: number;
    total_size?: string;
    total_size_in_bytes: number;
    total_stopped_time?: string;
    total_stopped_time_in_millis: number;
    total_throttled_time?: string;
    total_throttled_time_in_millis: number;
    total_time?: string;
    total_time_in_millis: number;
}

export interface IndexingStats {
    index_current: number;
    delete_current: number;
    delete_time?: string;
    delete_time_in_millis: number;
    delete_total: number;
    is_throttled: boolean;
    noop_update_total: number;
    throttle_time?: string;
    throttle_time_in_millis: number;
    index_time?: string;
    index_time_in_millis: number;
    index_total: number;
    index_failed: number;
    types?: Record<string, IndexingStats>;
}

export interface GetStats {
    current: number;
    exists_time?: string;
    exists_time_in_millis: number;
    exists_total: number;
    missing_time?: string;
    missing_time_in_millis: number;
    missing_total: number;
    time?: string;
    time_in_millis: number;
    total: number;
}

export interface FlushStats {
    periodic: number;
    total: number;
    total_time?: string;
    total_time_in_millis: number;
}

export interface FielddataStats {
    evictions?: number;
    memory_size?: number | string;
    memory_size_in_bytes: number;
    fields?: Record<string, FieldMemoryUsage>;
}

export interface FieldMemoryUsage {
    memory_size?: number | string;
    memory_size_in_bytes: number;
}

export interface DocStats {
    count: number;
    deleted: number;
}

export interface CompletionStats {
    size_in_bytes: number;
    size?: number | string;
    fields?: Record<string, FieldSizeUsage>;
}

export interface FieldSizeUsage {
    size?: string | number;
    size_in_bytes: number;
}

export interface NodesScripting {
    cache_evictions: number;
    compilations: number;
}

export interface NodesOperatingSystem {
    cpu: NodesCpu;
    mem: NodesExtendedMemoryStats;
    swap: NodesMemoryStats;
    timestamp: number;
}

export interface NodesExtendedMemoryStats extends NodesMemoryStats {
    free_percent: number;
    used_percent: number;
    total_in_bytes: number;
    free_in_bytes: number;
    used_in_bytes: number;
}

export interface NodesNodeBufferPool {
    count: number;
    total_capacity: string;
    total_capacity_in_bytes: number;
    used: string;
    used_in_bytes: number;
}

export interface NodesGarbageCollector {
    collectors: Record<string, NodesGarbageCollectorTotal>;
}

export interface NodesGarbageCollectorTotal {
    collection_count: number;
    collection_time: string;
    collection_time_in_millis: number;
}

export interface NodesJvm {
    buffer_pools: Record<string, NodesNodeBufferPool>;
    classes: NodesJvmClasses;
    gc: NodesGarbageCollector;
    mem: NodesMemoryStats;
    threads: NodesJvmThreads;
    timestamp: number;
    uptime: string;
    uptime_in_millis: number;
}

export interface NodesJvmClasses {
    current_loaded_count: number;
    total_loaded_count: number;
    total_unloaded_count: number;
}

export interface NodesJvmThreads {
    count: number;
    peak_count: number;
}

export interface NodesProcess {
    cpu: NodesCpu;
    mem: NodesMemoryStats;
    open_file_descriptors: number;
    timestamp: number;
}

export interface NodesMemoryStats {
    resident?: string;
    resident_in_bytes?: number;
    share?: string;
    share_in_bytes?: number;
    total_virtual?: string;
    total_virtual_in_bytes?: number;
    total_in_bytes: number;
    free_in_bytes: number;
    used_in_bytes: number;
}

export interface NodesCpu {
    percent: number;
    sys?: string;
    sys_in_millis?: number;
    total?: string;
    total_in_millis?: number;
    user?: string;
    user_in_millis?: number;
    load_average?: Record<string, number>;
}

export interface NodesIngest {
    pipelines: Record<string, NodesIngestTotal>;
    total: NodesIngestTotal;
}

export interface NodesKeyedProcessor {
    statistics: NodesProcess;
    type: string;
}

export interface NodesIngestTotal {
    count: number;
    current: number;
    failed: number;
    processors: NodesKeyedProcessor[];
    time_in_millis: number;
}

export interface NodesDataPathStats {
    available: string;
    available_in_bytes: number;
    disk_queue: string;
    disk_reads: number;
    disk_read_size: string;
    disk_read_size_in_bytes: number;
    disk_writes: number;
    disk_write_size: string;
    disk_write_size_in_bytes: number;
    free: string;
    free_in_bytes: number;
    mount: string;
    path: string;
    total: string;
    total_in_bytes: number;
    type: string;
}

export interface NodesFileSystem {
    data: NodesDataPathStats[];
    timestamp: number;
    total: NodesFileSystemTotal;
}

export interface NodesFileSystemTotal {
    available: string;
    available_in_bytes: number;
    free: string;
    free_in_bytes: number;
    total: string;
    total_in_bytes: number;
}

export interface NodesBreaker {
    estimated_size: string;
    estimated_size_in_bytes: number;
    limit_size: string;
    limit_size_in_bytes: number;
    overhead: number;
    tripped: number;
}

export interface NodesAdaptiveSelection {
    avg_queue_size: number;
    avg_response_time: number;
    avg_response_time_ns: number;
    avg_service_time: string;
    avg_service_time_ns: number;
    outgoing_searches: number;
    rank: string;
}

export interface ReindexBody {
    conflicts?: ConflictOptions;
    max_docs?: number;
    source: {
        index: string;
        query?: Record<string, any>;
        remote?: Remote;
        size?: number;
        slice?: {
            id?: number;
            max?: number;
        };
        _source?: boolean | string | string[];
    };
    dest: {
        index: string;
        version_type?: VersionType;
        op_type?: OpType;
        type?: string;
    };
    script?: {
        source?: string;
        lang?: ScriptLangs;
    };
}

export type AggregationsAggregate
    = | AggregationsSingleBucketAggregate
        | AggregationsAutoDateHistogramAggregate
        | AggregationsFiltersAggregate
        | AggregationsSignificantTermsAggregate<any>
        | AggregationsTermsAggregate<any>
        | AggregationsBucketAggregate
        | AggregationsCompositeBucketAggregate
        | AggregationsMultiBucketAggregate<AggregationsBucket>
        | AggregationsMatrixStatsAggregate
        | AggregationsKeyedValueAggregate
        | AggregationsMetricAggregate;

export interface AggregationsSingleBucketAggregateKeys extends AggregationsAggregateBase {
    doc_count: number;
}

export interface AggregationsKeyedValueAggregate extends AggregationsValueAggregate {
    keys: string[];
}

export type AggregationsValueBucket = { [property: string]: AggregationsAggregate };

export type AggregationsBucket
    = | AggregationsValueBucket
        | AggregationsKeyedBucket<any>;

export interface AggregationsValueAggregate extends AggregationsAggregateBase {
    value: number;
    value_as_string?: string;
}

export interface AggregationsBoxPlotAggregate extends AggregationsAggregateBase {
    min: number;
    max: number;
    q1: number;
    q2: number;
    q3: number;
}

export interface AggregationsGeoBoundsAggregate extends AggregationsAggregateBase {
    bounds: AggregationsGeoBounds;
}

export interface LatLon {
    lat: number;
    lon: number;
}

export interface AggregationsGeoBounds {
    bottom_right: LatLon;
    top_left: LatLon;
}

export interface AggregationsGeoCentroidAggregate extends AggregationsAggregateBase {
    count: number;
    location: QueryDslGeoLocation;
}

export type QueryDslGeoLocation = string | number[] | LatLon;

export interface AggregationsGeoLineAggregate extends AggregationsAggregateBase {
    type: string;
    geometry: AggregationsLineStringGeoShape;
    properties: AggregationsGeoLineProperties;
}

export interface AggregationsLineStringGeoShape {
    coordinates: QueryDslGeoCoordinate[];
}

export type QueryDslGeoCoordinate = string | number[] | QueryDslThreeDimensionalPoint;

export interface QueryDslThreeDimensionalPoint {
    lat: number;
    lon: number;
    z?: number;
}

export interface AggregationsGeoLineProperties {
    complete: boolean;
    sort_values: number[];
}

export type AggregationsMetricAggregate
    = | AggregationsValueAggregate
        | AggregationsBoxPlotAggregate
        | AggregationsGeoBoundsAggregate
        | AggregationsGeoCentroidAggregate
        | AggregationsGeoLineAggregate
        | AggregationsPercentilesAggregate
        | AggregationsScriptedMetricAggregate
        | AggregationsStatsAggregate
        | AggregationsStringStatsAggregate
        | AggregationsTopHitsAggregate
        | AggregationsTopMetricsAggregate
        | AggregationsExtendedStatsAggregate
        | AggregationsTDigestPercentilesAggregate
        | AggregationsHdrPercentilesAggregate;

export interface AggregationsTDigestPercentilesAggregate extends AggregationsAggregateBase {
    values: Record<string, number>;
}

export interface AggregationsHdrPercentilesAggregate extends AggregationsAggregateBase {
    values: AggregationsHdrPercentileItem[];
}

export interface AggregationsHdrPercentileItem {
    key: number;
    value: number;
}

export interface AggregationsStandardDeviationBounds {
    lower?: number;
    upper?: number;
    lower_population?: number;
    upper_population?: number;
    lower_sampling?: number;
    upper_sampling?: number;
}

export interface AggregationsExtendedStatsAggregate extends AggregationsStatsAggregate {
    std_deviation_bounds: AggregationsStandardDeviationBounds;
    sum_of_squares?: number;
    variance?: number;
    variance_population?: number;
    variance_sampling?: number;
    std_deviation?: number;
    std_deviation_population?: number;
    std_deviation_sampling?: number;
}

export interface AggregationsTopMetricsAggregate extends AggregationsAggregateBase {
    top: AggregationsTopMetrics[];
}

export interface AggregationsTopMetrics {
    sort: (number | number | string)[];
    metrics: Record<string, number | number | string>;
}

export interface SearchHitsMetadata<T = unknown> {
    total: SearchTotalHits | number;
    hits: SearchResult<T>[];
    max_score?: number;
}

export type SearchSortResults = (number | string | null)[];

export interface SearchNestedIdentity {
    field: string;
    offset: number;
    _nested?: SearchNestedIdentity;
}

export interface SearchInnerHitsMetadata {
    total: SearchTotalHits | number;
    hits: SearchResult<Record<string, any>>[];
    max_score?: number;
}

export interface SearchInnerHitsResult {
    hits: SearchInnerHitsMetadata;
}

export interface ExplainExplanation {
    description: string;
    details: ExplainExplanationDetail[];
    value: number;
}

export interface ExplainExplanationDetail {
    description: string;
    details?: ExplainExplanationDetail[];
    value: number;
}

export type SearchTotalHitsRelation = 'eq' | 'gte';

export interface SearchTotalHits {
    relation: SearchTotalHitsRelation;
    value: number;
}

export interface AggregationsTopHitsAggregate extends AggregationsAggregateBase {
    hits: SearchHitsMetadata<Record<string, any>>;
}

export interface AggregationsStringStatsAggregate extends AggregationsAggregateBase {
    count: number;
    min_length: number;
    max_length: number;
    avg_length: number;
    entropy: number;
    distribution?: Record<string, number>;
}
export interface AggregationsScriptedMetricAggregate extends AggregationsAggregateBase {
    value: any;
}

export interface AggregationsStatsAggregate extends AggregationsAggregateBase {
    count: number;
    sum: number;
    avg?: number;
    max?: number;
    min?: number;
}

export interface AggregationsPercentilesAggregate extends AggregationsAggregateBase {
    items: AggregationsPercentileItem[];
}

export interface AggregationsPercentileItem {
    percentile: number;
    value: number;
}

export interface AggregationsMatrixStatsAggregate extends AggregationsAggregateBase {
    correlation: Record<string, number>;
    covariance: Record<string, number>;
    count: number;
    kurtosis: number;
    mean: number;
    skewness: number;
    variance: number;
    name: string;
}

export interface AggregationsCompositeBucketAggregate
    extends AggregationsMultiBucketAggregate<Record<string, any>> {
    after_key: Record<string, any>;
}

export interface AggregationsFiltersAggregate extends AggregationsAggregateBase {
    buckets: AggregationsFiltersBucketItem[] | Record<string, AggregationsFiltersBucketItem>;
}
export interface AggregationsBucketAggregate extends AggregationsAggregateBase {
    after_key: Record<string, any>;
    bg_count: number;
    doc_count: number;
    doc_count_error_upper_bound: number;
    sum_other_doc_count: number;
    interval: string;
    items: AggregationsBucket;
}

export interface AggregationsTermsAggregate<TKey = unknown>
    extends AggregationsMultiBucketAggregate<TKey> {
    doc_count_error_upper_bound: number;
    sum_other_doc_count: number;
}

export interface AggregationsSignificantTermsAggregate<TKey = unknown>
    extends AggregationsMultiBucketAggregate<TKey> {
    bg_count: number;
    doc_count: number;
}

export interface AggregationsFiltersBucketItemKeys {
    doc_count: number;
}
export type AggregationsFiltersBucketItem
    = | AggregationsFiltersBucketItemKeys
        | { [property: string]: AggregationsAggregate };

export interface AggregationsMultiBucketAggregate<TBucket = unknown>
    extends AggregationsAggregateBase {
    buckets: TBucket[];
}

export interface AggregationsAggregateBase {
    meta?: Record<string, any>;
}

export interface AggregationsKeyedBucketKeys<TKey = unknown> {
    doc_count: number;
    key: TKey;
    key_as_string: string;
}

export interface AggregationsAutoDateHistogramAggregate
    extends AggregationsMultiBucketAggregate<AggregationsKeyedBucket<number>> {
    interval: string;
}

export type AggregationsKeyedBucket<TKey = unknown>
    = | AggregationsKeyedBucketKeys<TKey>
        | { [property: string]: AggregationsAggregate };

export type AggregationsSingleBucketAggregate
    = | AggregationsSingleBucketAggregateKeys
        | { [property: string]: AggregationsAggregate };

export interface HitsTotal {
    value: number;
    relation: 'eq' | 'gte';
}

export interface IndicesStatsIndicesStats {
    primaries: IndicesStatsIndexStats;
    shards?: Record<string, IndicesStatsShardStats[]>;
    total: IndicesStatsIndexStats;
    uuid?: string;
}

export interface IndicesStatsShardStats {
    commit: IndicesStatsShardCommit;
    completion: CompletionStats;
    docs: DocStats;
    fielddata: FielddataStats;
    flush: FlushStats;
    get: GetStats;
    indexing: IndexingStats;
    merges: MergesStats;
    shard_path: IndicesStatsShardPath;
    query_cache: IndicesStatsShardQueryCache;
    recovery: RecoveryStats;
    refresh: RefreshStats;
    request_cache: RequestCacheStats;
    retention_leases: IndicesStatsShardRetentionLeases;
    routing: IndicesStatsShardRouting;
    search: SearchStats;
    segments: SegmentsStats;
    seq_no: IndicesStatsShardSequenceNumber;
    store: StoreStats;
    translog: TranslogStats;
    warmer: WarmerStats;
    bulk?: BulkStats;
}

export interface IndicesStatsShardSequenceNumber {
    global_checkpoint: number;
    local_checkpoint: number;
    max_seq_no: number;
}

export interface IndicesStatsShardRouting {
    node: string;
    primary: boolean;
    relocating_node?: string;
    state: IndicesStatsShardRoutingState;
}

export type IndicesStatsShardRoutingState
    = | 'UNASSIGNED'
        | 'INITIALIZING'
        | 'STARTED'
        | 'RELOCATING';

export interface IndicesStatsShardRetentionLeases {
    primary_term: number;
    version: number;
    leases: IndicesStatsShardLease[];
}

export interface IndicesStatsShardLease {
    id: string;
    retaining_seq_no: number;
    timestamp: number;
    source: string;
}

export interface IndicesStatsShardQueryCache {
    cache_count: number;
    cache_size: number;
    evictions: number;
    hit_count: number;
    memory_size_in_bytes: number;
    miss_count: number;
    total_count: number;
}

export interface IndicesStatsShardPath {
    data_path: string;
    is_custom_data_path: boolean;
    state_path: string;
}

export interface IndicesStatsShardCommit {
    generation: number;
    id: string;
    num_docs: number;
    user_data: Record<string, string>;
}
