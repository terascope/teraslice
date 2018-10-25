// @ts-ignore
import bunyan from '@types/bunyan';
import { EventEmitter } from 'events';

export interface Logger extends bunyan {
    flush(): Promise<void>;
}

export interface ClusterStateConfig {
    connection: string|'default';
}

export enum RolloverFrequency {
    Daily = 'daily',
    Monthly = 'monthly',
    Yearly = 'yearly'
}

export interface IndexRolloverFrequency {
    state: RolloverFrequency|RolloverFrequency.Monthly;
    analytics: RolloverFrequency|RolloverFrequency.Monthly;
}

export enum ClusterManagerType {
    Native = 'native',
    Kubernetes = 'kubernetes'
}

export interface TerasliceConfig {
    action_timeout: number|300000;
    analytics_rate: number|60000;
    assets_directory?: string;
    assets_volume?: string;
    cluster_manager_type: ClusterManagerType|ClusterManagerType.Native;
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
}

export interface ConnectionConfig {
    endpoint: string;
    cached?: boolean;
    type: string;
}

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
    foundation: FoundationApis;
    registerAPI(namespace: string, apis: any): void;
    [namespace: string]: any;
}

export interface Context {
    apis: ContextApis;
    arch: string;
    assignment: string;
    foundation: LegacyFoundationApis;
    logger: Logger;
    name: string;
    platform: string;
    sysconfig: SysConfig;
}

export enum Assignment {
    AssetsService = 'assets_service',
    ClusterMaster = 'cluster_master',
    ExecutionController = 'execution_controller',
    NodeMaster = 'node_master',
    Worker = 'worker',
}
