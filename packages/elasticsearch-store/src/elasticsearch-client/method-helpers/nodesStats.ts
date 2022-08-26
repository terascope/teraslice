import { ElasticsearchDistribution } from '@terascope/types';
import { ErrorCause, NodeRoles } from './interfaces';
import type { Semver } from '../interfaces';

export interface NodesStatsParams {
    node_id?: string | string[];
    metric?: Metrics;
    index_metric?: Metrics;
    completion_fields?: string | string[];
    fielddata_fields?: string | string[];
    fields?: string | string[];
    groups?: boolean;
    include_segment_file_sizes?: boolean;
    level?: Level;
    master_timeout?: number | string;
    timeout?: number | string;
    types?: string[];
    include_unloaded_segments?: boolean;
}

export type Level = 'cluster' | 'indices' | 'shards'

export type Metrics = string | string[]

export interface NodesStatsResponse {
    cluster_name?: string;
    nodes: Record<string, NodesStats>;
    _nodes?: NodeStatistics;
}

export interface NodeStatistics {
    failures?: ErrorCause[]
    total: number
    successful: number
    failed: number
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
    rx_count: number
    rx_size: string
    rx_size_in_bytes: number
    server_open: number
    tx_count: number
    tx_size: string
    tx_size_in_bytes: number
}

export interface NodesThreadCount {
    active: number
    completed: number
    largest: number
    queue: number
    rejected: number
    threads: number
}

export interface IndicesStatsIndexStats {
    completion?: CompletionStats
    docs?: DocStats
    fielddata?: FielddataStats
    flush?: FlushStats
    get?: GetStats
    indexing?: IndexingStats
    merges?: MergesStats
    query_cache?: QueryCacheStats
    recovery?: RecoveryStats
    refresh?: RefreshStats
    request_cache?: RequestCacheStats
    search?: SearchStats
    segments?: SegmentsStats
    store?: StoreStats
    translog?: TranslogStats
    warmer?: WarmerStats
    bulk?: BulkStats
}

export interface StoreStats {
    size?: number | string
    size_in_bytes: number
    reserved?: number | string
    reserved_in_bytes: number
    total_data_set_size?: number | string
    total_data_set_size_in_bytes?: number
}

export interface BulkStats {
    total_operations: number
    total_time?: string
    total_time_in_millis: number
    total_size?: number | string
    total_size_in_bytes: number
    avg_time?: string
    avg_time_in_millis: number
    avg_size?: number | string
    avg_size_in_bytes: number
}

export interface WarmerStats {
    current: number
    total: number
    total_time?: string
    total_time_in_millis: number
}

export interface TranslogStats {
    earliest_last_modified_age: number
    operations: number
    size?: string
    size_in_bytes: number
    uncommitted_operations: number
    uncommitted_size?: string
    uncommitted_size_in_bytes: number
}

export interface SegmentsStats {
    count: number
    doc_values_memory?: number | string
    doc_values_memory_in_bytes: number
    file_sizes: Record<string, IndicesStatsShardFileSizeInfo>
    fixed_bit_set?: number | string
    fixed_bit_set_memory_in_bytes: number
    index_writer_memory?: number | string
    index_writer_max_memory_in_bytes?: number
    index_writer_memory_in_bytes: number
    max_unsafe_auto_id_timestamp: number
    memory?: number | string
    memory_in_bytes: number
    norms_memory?: number | string
    norms_memory_in_bytes: number
    points_memory?: number | string
    points_memory_in_bytes: number
    stored_memory?: number | string
    stored_fields_memory_in_bytes: number
    terms_memory_in_bytes: number
    terms_memory?: number | string
    term_vectory_memory?: number | string
    term_vectors_memory_in_bytes: number
    version_map_memory?: number | string
    version_map_memory_in_bytes: number
}

export interface IndicesStatsShardFileSizeInfo {
    description: string
    size_in_bytes: number
    min_size_in_bytes?: number
    max_size_in_bytes?: number
    average_size_in_bytes?: number
    count?: number
}

export interface SearchStats {
    fetch_current: number
    fetch_time_in_millis: number
    fetch_total: number
    open_contexts?: number
    query_current: number
    query_time_in_millis: number
    query_total: number
    scroll_current: number
    scroll_time_in_millis: number
    scroll_total: number
    suggest_current: number
    suggest_time_in_millis: number
    suggest_total: number
    groups?: Record<string, SearchStats>
}

export interface RequestCacheStats {
    evictions: number
    hit_count: number
    memory_size?: string
    memory_size_in_bytes: number
    miss_count: number
}

export interface RecoveryStats {
    current_as_source: number
    current_as_target: number
    throttle_time?: string
    throttle_time_in_millis: number
}

export interface RefreshStats {
    external_total: number
    external_total_time_in_millis: number
    listeners: number
    total: number
    total_time?: string
    total_time_in_millis: number
}

export interface QueryCacheStats {
    cache_count: number
    cache_size: number
    evictions: number
    hit_count: number
    memory_size?: number | string
    memory_size_in_bytes: number
    miss_count: number
    total_count: number
}

export interface MergesStats {
    current: number
    current_docs: number
    current_size?: string
    current_size_in_bytes: number
    total: number
    total_auto_throttle?: string
    total_auto_throttle_in_bytes: number
    total_docs: number
    total_size?: string
    total_size_in_bytes: number
    total_stopped_time?: string
    total_stopped_time_in_millis: number
    total_throttled_time?: string
    total_throttled_time_in_millis: number
    total_time?: string
    total_time_in_millis: number
}

export interface IndexingStats {
    index_current: number
    delete_current: number
    delete_time?: string
    delete_time_in_millis: number
    delete_total: number
    is_throttled: boolean
    noop_update_total: number
    throttle_time?: string
    throttle_time_in_millis: number
    index_time?: string
    index_time_in_millis: number
    index_total: number
    index_failed: number
    types?: Record<string, IndexingStats>
}

export interface GetStats {
    current: number
    exists_time?: string
    exists_time_in_millis: number
    exists_total: number
    missing_time?: string
    missing_time_in_millis: number
    missing_total: number
    time?: string
    time_in_millis: number
    total: number
}

export interface FlushStats {
    periodic: number
    total: number
    total_time?: string
    total_time_in_millis: number
}

export interface FielddataStats {
    evictions?: number
    memory_size?: number | string
    memory_size_in_bytes: number
    fields?: Record<string, FieldMemoryUsage>
}

export interface FieldMemoryUsage {
    memory_size?: number | string
    memory_size_in_bytes: number
}

export interface DocStats {
    count: number
    deleted: number
}

export interface CompletionStats {
    size_in_bytes: number
    size?: number | string
    fields?: Record<string, FieldSizeUsage>
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
    free_percent: number
    used_percent: number
    total_in_bytes: number
    free_in_bytes: number
    used_in_bytes: number
}

export interface NodesNodeBufferPool {
    count: number
    total_capacity: string
    total_capacity_in_bytes: number
    used: string
    used_in_bytes: number
}

export interface NodesGarbageCollector {
    collectors: Record<string, NodesGarbageCollectorTotal>
}

export interface NodesGarbageCollectorTotal {
    collection_count: number
    collection_time: string
    collection_time_in_millis: number
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

export function convertNodesStatsParams(
    params: NodesStatsParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            return params;
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                include_unloaded_segments,
                master_timeout,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                master_timeout,
                ...parsedParams
            } = params;

            if (master_timeout) {
                // @ts-expect-error, master_timeout is deprecated
                parsedParams.cluster_manager_timeout = master_timeout;
            }

            return parsedParams;
        }
        // future version will have master_timeout gone, renamed to cluster_manager_timeout
        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}
