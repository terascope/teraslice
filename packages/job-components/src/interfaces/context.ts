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
    assets_directory?: string;
    assets_volume?: string;
    cluster_manager_type: ClusterManagerType;
    hostname: string;
    index_rollover_frequency: IndexRolloverFrequency;
    kubernetes_config_map_name?: string|'teraslice-worker';
    kubernetes_image_pull_secret?: string|'';
    kubernetes_image?: string|'terascope/teraslice';
    kubernetes_namespace?: string|'default';
    master_hostname: string|'localhost';
    master: boolean|false;
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
    worker_disconnect_timeout: number|300000;
    workers: number|4;
}

export interface TerafoundationConfig {
    connectors: object;
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

export type ClientFactoryFn = (config: object, logger: Logger, options: ConnectionConfig) => { client: any };

export interface FoundationApis {
    makeLogger(...params: any[]): Logger;
    getSystemEvents(): EventEmitter;
    getConnection(config: ConnectionConfig): { client: any };
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
}

export interface JobRunnerAPI {
    /** Get the first opConfig from an operation name */
    getOpConfig(name: string): OpConfig|undefined;
}

export interface AssetsAPI {
    /* Get the asset path from a asset name or ID */
    getPath(name: string): Promise<string>;
}

export interface WorkerContext extends Context {
    apis: WorkerContextAPIs;
}

/**
 * WorkerContext includes the type definitions for
 * the APIs available to Worker.
 * This extends the Terafoundation Context.
*/
export interface WorkerContextAPIs extends ContextAPIs {
    /** Includes an API for getting a client from Terafoundation */
    assets: AssetsAPI;
    /** Includes an API for getting a client from Terafoundation */
    op_runner: OpRunnerAPI;
    /** Includes an API for getting a opConfig from the job */
    job_runner: JobRunnerAPI;
    /** An API for registering and loading the new Job APIs */
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
