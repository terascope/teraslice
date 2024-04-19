import { EventEmitter } from 'events';
import { Logger } from '@terascope/utils';
import { OpConfig } from './jobs';
import { ExecutionContextAPI } from '../execution-context';

export interface ClusterStateConfig {
    connection: string|'default';
}

export type RolloverFrequency = 'daily'|'montly'|'yearly';

export interface IndexRolloverFrequency {
    state: RolloverFrequency;
    analytics: RolloverFrequency;
}

export type ClusterManagerType = 'native'|'kubernetes';

export interface TerasliceConfig {
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

export interface TerafoundationConfig {
    connectors: Record<string, any>;
    asset_storage_connection_type?: string;
    asset_storage_connection?: string;
    asset_storage_bucket?: string;
    export_prom_metrics?: boolean;
    prom_metrics_main_port?: number;
    prom_metrics_assets_port?: number;
    prom_default_metrics?: boolean;
}

export interface SysConfig {
    terafoundation: TerafoundationConfig;
    teraslice: TerasliceConfig;
    _nodeName: string;
}

export interface ConnectionConfig {
    endpoint: string;
    cached?: boolean;
    type: string;
}

export type ClientFactoryFn = (
    config: Record<string, any>,
    logger: Logger,
    options: ConnectionConfig
) => { client: any };

export type CreateClientFactoryFn = (
    config: Record<string, any>,
    logger: Logger,
    options: ConnectionConfig
) => Promise<{ client: any }>;

export interface ExecutionControllerTargets {
    key: string;
    value: string;
}

export interface FoundationApis {
    makeLogger(...params: any[]): Logger;
    getSystemEvents(): EventEmitter;
    getConnection(config: ConnectionConfig): { client: any };
    createClient(config: ConnectionConfig): Promise<{ client: any }>;
    createPromMetricsAPI(
        context: Context,
        apiConfig: PromMetricsAPIConfig,
        logger: Logger,
        labels: Record<string, string>,
        jobOverride?: boolean
    ): Promise<void>;
    promMetrics: PromMetricsAPI
}

export interface LegacyFoundationApis {
    makeLogger(...params: any[]): Logger;
    getEventEmitter(): EventEmitter;
    getConnection(config: ConnectionConfig): { client: any };
}

export interface ContextApis {
    readonly foundation: FoundationApis;
    registerAPI(namespace: string, apis: any): void;
    [namespace: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ContextAPIs extends ContextApis {}

export interface GetClientConfig {
    connection?: string;
    endpoint?: string;
    connection_cache?: boolean;
}

/*
* This will request a connection based on the 'connection' attribute of
* an opConfig. Intended as a context API endpoint.
* If there is an error getting the connection, it will not throw an error
* it will log it and emit `client:initialization:error`
*/
export interface OpRunnerAPI {
    getClient(config: GetClientConfig, type: string): any;
    getClientAsync(config: GetClientConfig, type: string): Promise<any>;
}

export interface JobRunnerAPI {
    /** Get the first opConfig from an operation name */
    getOpConfig(name: string): OpConfig|undefined;
}

export interface AssetsAPI {
    /* Get the asset path from a asset name or ID */
    getPath(name: string): Promise<string>;
}

/**
 * WorkerContext includes the type definitions for
 * the APIs available to Worker or Slicer.
 * This extends the Terafoundation Context.
*/
export interface WorkerContextAPIs extends ContextAPIs {
    /**
     * Includes an API for getting a client from Terafoundation
    */
    assets: AssetsAPI;
    /**
     * Includes an API for getting a client from Terafoundation
    */
    op_runner: OpRunnerAPI;
    /**
     * Includes an API for getting a opConfig from the job
    */
    job_runner: JobRunnerAPI;
    /**
     * An API for registering and loading the new Job APIs
    */
    executionContext: ExecutionContextAPI;
}

export interface WorkerContext extends Context {
    apis: WorkerContextAPIs;
    assignment: 'execution_controller'|'worker';
}

export interface Context {
    apis: ContextAPIs;
    arch: string;
    assignment: Assignment;
    foundation: LegacyFoundationApis;
    logger: Logger;
    name: string;
    platform: string;
    sysconfig: SysConfig;
    cluster: ContextClusterConfig;
}

export interface ContextClusterConfig {
    worker: {
        id: string;
    };
}

export type Assignment = 'assets_service'|'cluster_master'|'node_master'|'execution_controller'|'worker';

export interface PromMetricsAPIConfig {
    assignment: string
    port: number
    default_metrics: boolean,
    labels?: Record<string, string>,
    prefix?: string
}

export interface PromMetricsAPI {
    set: (name: string, labels: Record<string, string>, value: number) => void;
    inc: (name: string, labelValues: Record<string, string>, value: number) => void;
    dec: (name: string, labelValues: Record<string, string>, value: number) => void;
    observe: (name: string, labelValues: Record<string, string>, value: number) => void;
    addMetric: (name: string, help: string, labelNames: Array<string>, type: 'gauge' | 'counter' | 'histogram',
        buckets?: Array<number>) => Promise<void>;
    addSummary: (name: string, help: string, labelNames: Array<string>,
        ageBuckets: number, maxAgeSeconds: number,
        percentiles: Array<number>) => void;
    hasMetric: (name: string) => boolean;
    deleteMetric: (name: string) => boolean;
}
