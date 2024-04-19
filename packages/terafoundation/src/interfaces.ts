import { Format } from 'convict';
import type {
    Gauge, Counter, Histogram, Summary
} from 'prom-client';
import { EventEmitter } from 'events';
import { Logger, Overwrite } from '@terascope/utils';
import {
    Cluster as NodeJSCluster,
    Worker as NodeJSWorker
} from 'cluster';

export type FoundationConfig<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string
> = {
    name: string;
    config_schema?: any;
    schema_formats?: Format[];
    default_config_file?: string;
    cluster_name?: string|((sysconfig: FoundationSysConfig<S>) => string);
    script?: (context: FoundationContext<S, A, D>) => void|Promise<void>;
    descriptors?: Record<D, string>;
    master?: (
        context: FoundationContext<S, A, D>,
        config: FoundationConfig<S, A, D>
    ) => void|Promise<void>;
    worker?: (
        context: FoundationContext<S, A, D>
    ) => void|Promise<void>;
    start_workers?: boolean;
    shutdownMessaging?: boolean;
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

export interface FoundationAPIs {
    /** Create a child logger */
    makeLogger(metadata?: Record<string, string>): Logger;
    /** Create the root logger (usually done automatically) */
    makeLogger(name: string, filename: string): Logger;
    getSystemEvents(): EventEmitter;
    getConnection(config: ConnectionConfig): { client: any };
    createClient(config: ConnectionConfig): Promise<{ client: any }>;
    startWorkers(num: number, envOptions: Record<string, string>): void;
    createPromMetricsAPI(config: CreatePromMetricsConfig): Promise<void>;
    promMetrics?: PromMetricsAPI
}

export interface LegacyFoundationApis {
    /** Create a child logger */
    makeLogger(metadata?: Record<string, string>): Logger;
    /** Create the root logger (usually done automatically) */
    makeLogger(name: string, filename: string): Logger;
    getEventEmitter(): EventEmitter;
    getConnection(config: ConnectionConfig): { client: any };
    startWorkers(num: number, envOptions: Record<string, string>): void;
}

export type ContextAPIs = {
    readonly foundation: FoundationAPIs;
    registerAPI(namespace: string, apis: any): void;
}

export type LogType = 'console' | 'file';
export type LogLevelType = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogLevelConfig = string|({
    [type in LogType]: LogLevelType;
}[])

export interface FoundationWorker extends NodeJSWorker {
    __process_restart?: boolean;
    service_context: any;
    assignment: string;
}

export type Cluster = Overwrite<NodeJSCluster, {
    fork(env?: any): FoundationWorker;
    workers: {
        [id: string]: FoundationWorker;
    };
}>;

export type FoundationSysConfig<S> = {
    _nodeName: string;
    terafoundation: {
        workers: number;
        environment: 'production'|'development'|'test'|string;
        connectors: Record<string, any>;
        log_path: string;
        log_level: LogLevelConfig;
        logging: LogType[];
        asset_storage_connection_type?: string;
        asset_storage_connection?: string;
        asset_storage_bucket?: string;
        export_prom_metrics?: boolean;
        prom_metrics_main_port?: number;
        prom_metrics_assets_port?: number;
        prom_default_metrics?: boolean;
    };
} & S;

export type FoundationContext<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string
> = {
    sysconfig: FoundationSysConfig<S>;
    apis: ContextAPIs & A;
    foundation: LegacyFoundationApis;
    logger: Logger;
    name: string;
    arch: string;
    platform: string;
    assignment: D;
    cluster_name?: string;
    cluster: Cluster;
}

export type ParsedArgs<S> = {
    configfile: FoundationSysConfig<S>;
};

export interface CreatePromMetricsConfig {
    callingContext: FoundationContext,
    logger: Logger,
    jobOverride?: boolean,
    assignment: string
    port?: number
    default_metrics?: boolean,
    labels?: Record<string, string>,
    prefix?: string
}
export interface PromMetricsAPIConfig {
    assignment: string
    port: number
    default_metrics: boolean,
    labels?: Record<string, string>,
    prefix?: string
}

export type MetricList = Record<string, {
    readonly name?: string | undefined,
    readonly metric?: Gauge<any> | Counter<any> | Histogram<any> | Summary<any> | undefined,
    readonly functions?: Set<string> | undefined
}>;

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
