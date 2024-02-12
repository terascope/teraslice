export type ClusterManagerType = 'native'|'kubernetes';

export interface AssetRecord {
    blob: BinaryType;
    name: string;
    version: string;
    id: string;
    description?: string;
    arch?: string;
    platform?: string;
    node_version: number;
    _created: string|Date;
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
    '@timestamp': string|Date;
}

// TODO: make type for valid states
// TODO: fix types here
export interface JobRecord extends ValidatedJobConfig {
    job_id: string;
    _context: 'job';
    _created: string | Date;
    _updated: string | Date;
}

export enum RecoveryCleanupType {
    all = 'all',
    errors = 'errors',
    pending = 'pending'
}

export interface ExecutionRecord extends ValidatedJobConfig {
    job_id: string;
    ex_id: string;
    _context: 'ex';
    _created: string | Date;
    _updated: string | Date;
    // TODO: fix this
    metadata: Record<string, any>;
    recovered_execution?: string;
    recovered_slice_type?: RecoveryCleanupType;
    _status: string;
    _has_errors: boolean;
    _slicer_stats: Record<string, any>;
    _failureReason: string
    slicer_port?: number;
    slicer_hostname: string;
}

export interface StateRecord {
    ex_id: string;
    slice_id: string;
    slicer_id: string;
    slicer_order: number;
    state: string;
    _created: string|Date;
    _updated: string|Date;
    error?: string;
}

export interface ExecutionAnalytics extends AggregatedExecutionAnalytics {
    workers_available: number,
    workers_active: number,
    subslices: number,
    slice_range_expansion: number,
    slicers: number,
    subslice_by_key: number,
    started: undefined | string | number | Date,
    queuing_complete: undefined | string | number | Date,
}

// TODO: better description here of what this is
export interface AggregatedExecutionAnalytics {
    processed: number,
    failed: number,
    queued: number,
    job_duration: number,
    workers_joined: number,
    workers_reconnected: number,
    workers_disconnected: number,
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

export interface SliceRequest {
    request_worker?: string;
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

export type JobConfig = Partial<ValidatedJobConfig>;

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
    external_ports?: (number|ExternalPort)[];
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
}

export interface Targets {
    key: string;
    value: string;
}

export interface ExternalPort {
    name: string;
    containerPort: number
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
    status: ExecutionStatus.paused;
}

export interface ApiResumeResponse {
    status: ExecutionStatus.running;
}

export interface ApiStoppedResponse {
    status: ExecutionStatus.stopped | ExecutionStatus.stopping;
}

export interface ApiChangeWorkerResponse {
    message: string;
}

export interface ApiAssetStatusResponse {
    available: boolean;
}

/*
    Execution Context
*/

export enum ExecutionStatus {
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

export type ExecutionInitStatus =
    ExecutionStatus.pending |
    ExecutionStatus.scheduling |
    ExecutionStatus.recovering;

export type ExecutionRunningStatus =
    ExecutionStatus.recovering |
    ExecutionStatus.running |
    ExecutionStatus.failing |
    ExecutionStatus.paused |
    ExecutionStatus.stopping;

export type ExecutionTerminalStatus =
    ExecutionStatus.completed |
    ExecutionStatus.stopped |
    ExecutionStatus.rejected |
    ExecutionStatus.failed |
    ExecutionStatus.terminated;

export interface ExecutionControllerTargets {
    key: string;
    value: string;
}

export type RolloverFrequency = 'daily'|'montly'|'yearly';

// TODO: is this really double?
export interface IndexRolloverFrequency {
    state: RolloverFrequency;
    analytics: RolloverFrequency;
}

export interface Config {
    action_timeout: number|300000;
    analytics_rate: number|60000;
    api_response_timeout?: number|300000;
    assets_directory?: string[] | string;
    assets_volume?: string;
    cluster_manager_type: ClusterManagerType;
    /** This will only be available in the context of k8s */
    cpu?: number;
    /** This will only be available in the context of k8s */
    cpu_execution_controller?: number|0.5;
    /** This will only be available in the context of k8s */
    ephemeral_storage?: boolean|false;
    execution_controller_targets?: ExecutionControllerTargets[];
    hostname: string;
    index_rollover_frequency: IndexRolloverFrequency;
    kubernetes_api_poll_delay?: number|1000;
    kubernetes_config_map_name?: string|'teraslice-worker';
    kubernetes_image_pull_secret?: string|'';
    kubernetes_image?: string|'terascope/teraslice';
    kubernetes_namespace?: string|'default';
    kubernetes_overrides_enabled?: boolean|false;
    kubernetes_priority_class_name?: string|'';
    kubernetes_worker_antiaffinity?: boolean|false;
    master_hostname: string|'localhost';
    master: boolean|false;
    /** This will only be available in the context of k8s */
    memory?: number;
    /** This will only be available in the context of k8s */
    memory_execution_controller?: number|512000000; // 512 MB
    name: string|'teracluster';
    network_latency_buffer: number|15000;
    node_disconnect_timeout: number|300000;
    node_state_interval: number|5000;
    port: number|5678;
    shutdown_timeout: number|number;
    slicer_allocation_attempts: number|3;
    slicer_port_range: string|'45679:46678';
    slicer_timeout: number|180000;
    state: ClusterStateConfig;
    env_vars: { [key: string]: string };
    worker_disconnect_timeout: number|300000;
    workers: number|4;
}

export interface ClusterStateConfig {
    connection: string|'default';
}

export type Assignment = 'assets_service'|'cluster_master'|'node_master'|'execution_controller'|'worker';
