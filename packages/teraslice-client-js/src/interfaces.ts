import {
    ClusterManagerType,
    Assignment,
    ValidatedJobConfig,
    ExecutionConfig,
    SliceRequest,
    Omit,
    Overwrite,
    RecoveryCleanupType
} from '@terascope/job-components';
import * as got from 'got';

export interface ClientConfig {
    host?: string;
    baseUrl?: string;
    apiVersion?: string;
    timeout?: number;
}
// TODO: lockdown query parameter types

export interface APISearchParams {
    size?: number;
    from?: number;
    sort?: string;
}

export interface TxtSearchParams extends APISearchParams {
    fields?: string | string[];
}

export type SearchJobStatus = '*' | ExecutionStatus;

export type JobListStatusQuery = SearchJobStatus | JobSearchParams;

export interface JobSearchParams extends APISearchParams {
    status: SearchJobStatus;
}

export type SearchQuery = APISearchParams & Record<string, any>;

export type RequestOptions = got.Options;

export type SearchOptions = Omit<got.Options, 'searchParams'>;

export type PostData = string | NodeJS.ReadableStream | Buffer;

export type TxtType = 'assets' | 'slicers' | 'ex' | 'jobs' | 'nodes' | 'workers';

export interface RootResponse {
    arch: string;
    clustering_type: ClusterManagerType;
    name: string;
    node_version: string;
    platform: string;
    teraslice_version: string;
}

export interface ErrorResponse {
    error: number;
    message: string;
}

export interface JobNativeProcess extends NativeProcess {
    node_id: string;
}

export interface JobKubernetesProcess extends KubernetesProcess {
    node_id: string;
}

export type JobProcesses = JobNativeProcess | JobKubernetesProcess;

export type WorkerJobProcesses = Overwrite<JobProcesses, { assignment: 'worker' }>;

/*
    ASSETS
*/
export interface Asset {
    _created: string;
    version: string;
    id: string;
    name: string;
    description?: string;
    blob?: string;
}

export interface AssetStatusResponse {
    available: boolean;
}

export type AssetIDResponse = {
    _id: string;
}

/*
    Cluster State Native
*/

export interface NativeProcess {
    worker_id: string;
    assignment: Assignment;
    pid: number;
    ex_id?: string;
    job_id?: string;
}

export interface BaseClusterState {
    node_id: string;
    hostname: string;
    pid: number|'N/A';
    node_version: string;
    teraslice_version: string;
    total: number|'N/A';
    state: string;
    available: number|'N/A';
    active: any[];
}

export interface ClusterStateNodeNative extends BaseClusterState {
    node_id: string;
    hostname: string;
    pid: number;
    node_version: string;
    teraslice_version: string;
    total: number;
    state: string;
    available: number;
    active: NativeProcess[];
}

export interface ClusterStateNative {
    [key: string]: ClusterStateNodeNative;
}

/*
    Cluster State Kubernetes
*/

export interface KubernetesProcess {
    worker_id: string;
    assignment: Assignment;
    pod_name: string;
    ex_id: string;
    job_id: string;
    pod_ip: string;
    assets: string[];
    image: string;
}

export interface ClusterStateNodeKubernetes extends BaseClusterState {
    node_id: string;
    hostname: string;
    pid: 'N/A';
    node_version: 'N/A';
    teraslice_version: 'N/A';
    total: 'N/A';
    state: 'connected';
    available: 'N/A';
    active: KubernetesProcess[];
}

export interface ClusterStateKubernetes {
    [key: string]: ClusterStateNodeKubernetes;
}

export type ClusterState = ClusterStateNative | ClusterStateKubernetes;
export type ClusterProcess = NativeProcess | KubernetesProcess;

/*
    Jobs
*/

export interface JobConfiguration extends ValidatedJobConfig {
    job_id: string;
    _context: 'job';
    _created: string;
    _updated: string;
}

export interface JobIDResponse {
    job_id: string;
    ex_id?: string;
}

/*
    Cluster Stats
*/

export interface SliceAccumulationStats {
    processed: number;
    failed: number;
    queued: number;
    job_duration: number;
    workers_joined: number;
    workers_disconnected: number;
    workers_reconnected: number;
}

export interface ClusterStats {
    controllers: SliceAccumulationStats;
    slicer: SliceAccumulationStats;
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

export interface SlicerAnalytics extends SliceAccumulationStats {
    workers_available: number;
    workers_active: number;
    subslices: number;
    slice_range_expansion: number;
    slicers: number;
    subslice_by_key: number;
    started?: string;
    queuing_complete?: string;
}

export interface Execution extends ExecutionConfig {
    _context: 'ex';
    _created: string;
    _updated: string;
    _status: ExecutionStatus;
    _has_errors?: boolean;
    _failureReason?: string;
    _slicer_stats?: SlicerAnalytics;
}

// Native Cluster => terminated, stats null
// failing, hasErrors, failureReason, slice stats
// failed, hasErrors, failureReason, slice stats
// teraminated, hasErrors, failureReason, slice stats
// completed, slice stats
// stopping/stopped, slice stats

export interface ExecutionIDResponse {
    ex_id: string;
}

/*
*    Lifecyle Response
*/

/**
 * Recover Job / Execution Options
*/
export interface RecoverQuery {
    /** @deprecated use `cleanup_type` */
    cleanup?: RecoveryCleanupType;
    cleanup_type?: RecoveryCleanupType;
}

export interface PausedResponse {
    status: ExecutionStatus.paused;
}

export interface ResumeResponse {
    status: ExecutionStatus.running;
}

export interface StoppedResponse {
    status: ExecutionStatus.stopped | ExecutionStatus.stopping;
}

export interface StopQuery {
    timeout?: number;
    blocking?: boolean;
    force?: boolean;
}

export interface AssetUploadQuery {
    blocking?: boolean;
}

/*
    Worker changes Response
*/

export type ChangeWorkerQueryParams = 'add' | 'remove' | 'total';

export interface ChangeWorkerResponse {
    message: string;
}

/*
    Slicer/Controller Response
*/

export interface SlicerStats extends SlicerAnalytics {
    ex_id: string;
    job_id: string;
}

export type ControllerState = SlicerStats[];

/*
    Error Response
*/

export interface ErrorStateRecord {
    ex_id: string;
    slice_id: string;
    slicer_id: string;
    slicer_order: number;
    request: SliceRequest;
    state: 'error';
    error: string;
    _created: string;
    _updated: string;
}

export type StateErrors = ErrorStateRecord[];
