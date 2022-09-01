import { ElasticsearchDistribution } from '@terascope/types';
import { PluginStats, NodeRoles } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface NodesInfoParams {
    node_id?: string
    metric?: string | string[];
    flat_settings?: boolean
    master_timeout?: string | number;
    timeout?: string | number;
}

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

export interface NodesInfoNodeInfo{
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
    routing?: IndicesIndexRouting
    election: NodesInfoNodeInfoSettingsClusterElection
    initial_cluster_manager_nodes?: string
    initial_master_nodes?: string
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

export interface NodesInfoResponse {
    cluster_name: string;
    nodes: Record<string, NodesInfoNodeInfo>;
}

export function convertNodeInfoParams(
    params: NodesInfoParams,
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            return params;
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                master_timeout,
                ...parsedParams
            } = params;

            return parsedParams;
        }
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
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
