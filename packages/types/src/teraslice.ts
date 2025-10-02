import { SysConfig as BaseSysconfig } from './terafoundation.js';

export type ClusterManagerType = 'native' | 'kubernetesV2';

export interface AssetRecord {
    blob: SharedArrayBuffer | string | Buffer;
    name: string;
    version: string;
    id: string;
    description?: string;
    arch?: string;
    platform?: string;
    node_version?: number;
    _created: string | Date;
    external_storage?: string;
}

export interface AssetStatusResponse {
    available: boolean;
}

export type AssetIDResponse = {
    asset_id: string;
    /**
        @deprecated Use asset_id instead, will be removed in teraslice v3
    */
    _id?: string;
};

// On asset upload
export interface AssetUploadQuery {
    blocking?: boolean;
}

export interface JobSearchParams extends APISearchParams {
    deleted?: boolean;
    active?: boolean;
}

export type SearchQuery = APISearchParams & Record<string, any>;

export interface APISearchParams {
    size?: number;
    from?: number;
    sort?: string;
}

export interface TxtSearchParams extends APISearchParams {
    fields?: string | string[];
}

export interface AnalyticsRecord {
    ex_id: string;
    job_id: string;
    worker_id: string;
    slice_id: string;
    slicer_id: string;
    op: string;
    order: number;
    count: number;
    state: string;
    time: number;
    memory: number;
    '@timestamp': string | Date;
}

// TODO: make type for valid states
// TODO: fix types here
export interface JobConfig extends ValidatedJobConfig {
    job_id: string;
    _context: 'job';
    _created: string | Date;
    _updated: string | Date;
    _deleted?: boolean;
    _deleted_on?: string | Date;
    ex?: any;
}

export enum RecoveryCleanupType {
    all = 'all',
    errors = 'errors',
    pending = 'pending'
}

export interface ExecutionConfig extends ValidatedJobConfig {
    job_id: string;
    ex_id: string;
    _context: 'ex';
    _created: string | Date;
    _updated: string | Date;
    _deleted?: boolean;
    _deleted_on?: string | Date;
    // TODO: fix this
    metadata: Record<string, any>;
    recovered_execution?: string;
    recovered_slice_type?: RecoveryCleanupType;
    _status: ExecutionStatus;
    _has_errors: boolean;
    _slicer_stats: Record<string, any>;
    _failureReason?: string;
    slicer_port: number;
    slicer_hostname: string;
}

export interface StateRecord {
    ex_id: string;
    slice_id: string;
    slicer_id: string;
    slicer_order: number;
    state: string;
    _created: string | Date;
    _updated: string | Date;
    error?: string;
}

export interface ErrorRecord extends StateRecord {
    state: 'error';
    error: string;
}

export interface ExecutionAnalytics extends AggregatedExecutionAnalytics {
    workers_available: number;
    workers_active: number;
    subslices: number;
    slice_range_expansion: number;
    slicers: number;
    subslice_by_key: number;
    started: undefined | string | number | Date;
    queuing_complete: undefined | string | number | Date;
}

export interface ExecutionAnalyticsResponse extends ExecutionAnalytics {
    ex_id: string;
    job_id: string;
    name: string;
}

export type ExecutionList = ExecutionAnalyticsResponse[];

// TODO: better description here of what this is
export interface AggregatedExecutionAnalytics {
    processed: number;
    failed: number;
    queued: number;
    job_duration: number;
    workers_joined: number;
    workers_reconnected: number;
    workers_disconnected: number;
}

export interface ClusterStats {
    controllers: AggregatedExecutionAnalytics;
    slicer: AggregatedExecutionAnalytics;
}

export interface ExecutionIDResponse {
    ex_id: string;
}

/**
 * A trackable set of work to be preformed by a "Worker"
 */
export interface Slice {
    /**
     * A unique identifier for the slice
     */
    slice_id: string;
    /**
     * A reference to the slicer that created the slice.
     */
    slicer_id: number;
    /**
     * A reference to the slicer
     */
    slicer_order: number;
    request: SliceRequest;
    _created: string;
}

/**
 * The metadata created by the Slicer and ran through a job pipeline
 *
 * See [[Slice]]
 */
export interface SliceRequest {
    /** A reserved key for sending work to a particular worker */
    request_worker?: string;
    /** The slice request can contain any metadata */
    [prop: string]: any;
}

// TODO: different?
export interface SliceAnalyticsData {
    time: number[];
    size: number[];
    memory: number[];
}
export interface EnqueuedWorker {
    workerId: string;
}

export interface SliceCompletePayload {
    slice: Slice;
    analytics: SliceAnalyticsData;
    retry?: boolean;
    error?: string;
}

export type LifeCycle = 'once' | 'persistent';

export interface JobConfigParams extends Partial<ValidatedJobConfig> {
    operations: OpConfig[];
}

/**
 * Available data encoding types for a DataEntity
 */
export enum DataEncoding {
    JSON = 'json',
    RAW = 'raw',
}

/**
 * OpConfig is the configuration that user specifies
 * for a Operation.
 * The only required property is `_op` since that is used
 * to find the operation.
 */
export interface OpConfig {
    /** The name of the operation */
    _op: string;

    /** The name of the api used by this operation */
    api_name?: string;

    /** The name of connection, should match the same as listed in your sysconfigs.connectors */
    connection?: string;
    /**
     * Used for specifying the data encoding type when using `DataEntity.fromBuffer`.
     *
     * @default `json`.
    */
    _encoding?: DataEncoding;
    /**
     * This action will specify what to do when failing to parse or transform a record.
     * The following builtin actions are supported:
     *  - "throw": throw the original error
     *  - "log": log the error and the data
     *  - "none": (default) skip the error entirely
     *
     * If none of the actions are specified it will try and
     * use a registered Dead Letter Queue API under that name.
     * The API must be already be created by a operation before it can used.
    */
    _dead_letter_action?: DeadLetterAction;
    [prop: string]: any;
}

export interface ValidatedJobConfig {
    active: boolean;
    analytics: boolean;
    assets: string[];
    /** This may not exist until ran in an execution */
    assetIds?: string[];
    autorecover?: boolean;
    lifecycle: LifeCycle;
    max_retries: number;
    name: string;
    apis: APIConfig[];
    operations: OpConfig[];
    probation_window: number;
    performance_metrics?: boolean;
    env_vars: { [key: string]: string };
    log_level?: string;
    slicers: number;
    workers: number;
    stateful?: boolean;
    /** This will only be available in the context of k8s */
    labels?: { [key: string]: string };
    /** This will only be available in the context of k8s */
    targets?: Targets[];
    /** This will only be available in the context of k8s */
    cpu?: number;
    /** This will only be available in the context of k8s */
    cpu_execution_controller?: number;
    /** This will only be available in the context of k8s */
    ephemeral_storage?: boolean;
    /** This will only be available in the context of k8s */
    external_ports?: (number | ExternalPort)[];
    /** This will only be available in the context of k8s */
    memory?: number;
    /** This will only be available in the context of k8s */
    memory_execution_controller?: number;
    /** This will only be available in the context of k8s */
    pod_spec_override?: Record<string, any>;
    /** This will only be available in the context of k8s */
    resources_requests_cpu?: number;
    /** This will only be available in the context of k8s */
    resources_requests_memory?: number;
    /** This will only be available in the context of k8s */
    resources_limits_cpu?: number;
    /** This will only be available in the context of k8s */
    resources_limits_memory?: number;
    /** This will only be available in the context of k8s */
    volumes?: Volume[];
    /** This will only be available in the context of k8s */
    kubernetes_image?: string;
    /** This will only be available in the context of k8s */
    prom_metrics_enabled?: boolean;
    /** This will only be available in the context of k8s */
    prom_metrics_port?: number;
    /** This will only be available in the context of k8s */
    prom_metrics_add_default?: boolean;
}

// TODO: rename ExecutionControllerTargets???
export interface Targets {
    key: string;
    value: string;
}

export interface ExternalPort {
    name: string;
    port: number;
}

export interface Volume {
    name: string;
    path: string;
}

/**
 * available dead letter queue actions
 */
export type DeadLetterAction = 'throw' | 'log' | 'none' | string;

/** A supported DeadLetterAPIFn */
export type DeadLetterAPIFn = (input: any, err: Error) => void;

/**
 * APIConfig is the configuration for loading APIs and Observers
 * into a ExecutionContext.
 */
export interface APIConfig {
    /**
     * The name of the api, this must be unique among any loaded APIs
     * but can be namespaced by using the format "example:0"
     */
    _name: string;
    /**
     * Used for specifying the data encoding type when using `DataEntity.fromBuffer`.
     *
     * @default `json`.
    */
    _encoding?: DataEncoding;
    /**
    * This action will specify what to do when failing to parse or transform a record.
    * The following builtin actions are supported:
    *  - "throw": throw the original error
    *  - "log": log the error and the data
    *  - "none": (default) skip the error entirely
    *
    * If none of the actions are specified it will try and
    * use a registered Dead Letter Queue API under that name.
    * The API must be already be created by a operation before it can used.
   */
    _dead_letter_action?: DeadLetterAction;
    [prop: string]: any;
}

export interface StopQuery {
    timeout?: number;
    blocking?: boolean;
}

export interface ApiRootResponse {
    arch: string;
    clustering_type: ClusterManagerType;
    name: string;
    node_version: string;
    platform: string;
    teraslice_version: string;
}

export interface ApiJobCreateResponse {
    job_id: string;
    ex_id?: string;
}

export interface ApiPausedResponse {
    status: ExecutionStatusEnum.paused;
}

export interface ApiResumeResponse {
    status: ExecutionStatusEnum.running;
}

export interface ApiStoppedResponse {
    status: ExecutionStatusEnum.stopped | ExecutionStatusEnum.stopping;
}

export interface ApiChangeWorkerResponse {
    message: string;
}

export interface ApiAssetStatusResponse {
    available: boolean;
}

export interface RecoverQuery {
    cleanup?: RecoveryCleanupType;
}

/*
    Execution Context
*/

export enum ExecutionStatusEnum {
    pending = 'pending',
    scheduling = 'scheduling',
    initializing = 'initializing',

    running = 'running',
    recovering = 'recovering',
    failing = 'failing',
    paused = 'paused',
    stopping = 'stopping',

    completed = 'completed',
    stopped = 'stopped',
    rejected = 'rejected',
    failed = 'failed',
    terminated = 'terminated'
}

export type ExecutionStatus = keyof typeof ExecutionStatusEnum;

export type ExecutionInitStatus
    = ExecutionStatusEnum.pending
        | ExecutionStatusEnum.scheduling
        | ExecutionStatusEnum.recovering;

export type ExecutionRunningStatus
    = ExecutionStatusEnum.recovering
        | ExecutionStatusEnum.running
        | ExecutionStatusEnum.failing
        | ExecutionStatusEnum.paused
        | ExecutionStatusEnum.stopping;

export type ExecutionTerminalStatus
    = ExecutionStatusEnum.completed
        | ExecutionStatusEnum.stopped
        | ExecutionStatusEnum.rejected
        | ExecutionStatusEnum.failed
        | ExecutionStatusEnum.terminated;

export interface ExecutionControllerTargets {
    key: string;
    value: string;
}

export type RolloverFrequency = 'daily' | 'monthly' | 'yearly';

// TODO: is this really double?
export interface IndexRolloverFrequency {
    state: RolloverFrequency;
    analytics: RolloverFrequency;
}

export interface Config {
    action_timeout: number;
    analytics_rate: number;
    api_response_timeout: number;
    assets_directory: string[] | string;
    asset_storage_connection_type: string;
    asset_storage_connection: string;
    asset_storage_bucket: string;
    assets_volume: string;
    cluster_manager_type: ClusterManagerType;
    /** This will only be available in the context of k8s */
    cpu?: number;
    /** This will only be available in the context of k8s */
    cpu_execution_controller: number;
    /** This will only be available in the context of k8s */
    ephemeral_storage: boolean;
    execution_controller_targets?: ExecutionControllerTargets[];
    hostname: string;
    index_rollover_frequency: IndexRolloverFrequency;
    kubernetes_api_poll_delay: number;
    kubernetes_config_map_name: string;
    kubernetes_image_pull_secret: string;
    kubernetes_image: string;
    kubernetes_namespace: string;
    kubernetes_overrides_enabled: boolean;
    kubernetes_priority_class_name?: string;
    kubernetes_worker_antiaffinity: boolean;
    master_hostname: string;
    master: boolean;
    /** This will only be available in the context of k8s */
    memory?: number;
    /** This will only be available in the context of k8s */
    memory_execution_controller: number;
    name: string;
    network_latency_buffer: number;
    node_disconnect_timeout: number;
    node_state_interval: number;
    port: number;
    shutdown_timeout: number;
    slicer_allocation_attempts: number;
    slicer_port_range: string;
    slicer_timeout: number;
    state: { connection: string };
    env_vars: { [key: string]: string };
    worker_disconnect_timeout: number;
    workers: number;
}

export interface TerasliceConfig {
    teraslice: Config;
}

export interface SysConfig extends BaseSysconfig<TerasliceConfig> {}

export type Assignment = 'assets_service' | 'cluster_master' | 'node_master' | 'execution_controller' | 'worker';

interface BaseWorkerNode {
    worker_id: string | number;
    pid?: number;
}

export enum ProcessAssignment {
    cluster_master = 'cluster_master',
    assets_service = 'assets_service',
    execution_controller = 'execution_controller',
    worker = 'worker'
}

export interface ClusterNode extends BaseWorkerNode {
    assignment: ProcessAssignment.cluster_master;
}

export interface AssetNode extends BaseWorkerNode {
    assignment: ProcessAssignment.assets_service;
}

export interface ExecutionNode extends BaseWorkerNode {
    assignment: ProcessAssignment.execution_controller;
    ex_id: string;
    job_id: string;
}
export interface WorkerNode extends BaseWorkerNode {
    assignment: ProcessAssignment.worker;
    ex_id: string;
    job_id: string;
}

type ExecutionProcess = ExecutionNode | WorkerNode;

export function isExecutionProcess(node: ProcessNode): node is ExecutionProcess {
    const { assignment: type } = node;
    if (type === ProcessAssignment.execution_controller || type === ProcessAssignment.worker) {
        return true;
    }
    return false;
}

export type ProcessNode = ClusterNode
    | AssetNode
    | ExecutionNode
    | WorkerNode;

// TODO: find out about state
export interface NodeState {
    node_id: string;
    hostname: string;
    pid: number | 'N/A';
    node_version: string;
    teraslice_version: string;
    total: number | 'N/A';
    state: string;
    available: number | 'N/A';
    active: ProcessNode[];
}

export interface ClusterState {
    [nodeId: string]: NodeState;
}

export type ChangeWorkerQueryParams = 'add' | 'remove' | 'total';

export interface ChangeWorkerResponse {
    message: string;
}
