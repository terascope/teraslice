import type { EventEmitter } from 'node:events';
import {
    Cluster as NodeJSCluster,
    Worker as NodeJSWorker
} from 'node:cluster';
import type { Overwrite } from './utility';
import type { Logger } from './logger';

interface Format {
    name?: string | undefined;
    validate?(val: any, schema: SchemaObj): void;
    coerce?(val: any): any;
}

interface SchemaObj<T = any> {
    default: T | null;
    doc?: string | undefined;
    format?: any;
    env?: string | undefined;
    arg?: string | undefined;
    sensitive?: boolean | undefined;
    nullable?: boolean | undefined;
    [key: string]: any;
}

export type Schema<T> = {
    [P in keyof T]: Schema<T[P]> | SchemaObj<T[P]>;
};

export type Initializers<S> = {
    schema: Schema<Record<string, any>>
    validatorFn?: ValidatorFn<S>
}

export type ValidationObj<S>= {
    subconfig: Record<string, any>,
    validatorFn?: ValidatorFn<S>,
    connector?: boolean
}

export type ValidatorFn<S> = (
    subconfig: Record<string, any>,
    sysconfig: SysConfig<S>
) => void

export type Config<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string
> = {
    name: string;
    config_schema?: any;
    schema_formats?: Format[];
    default_config_file?: string;
    cluster_name?: string|((sysconfig: SysConfig<S>) => string);
    script?: (context: Context<S, A, D>) => void|Promise<void>;
    descriptors?: Record<D, string>;
    master?: (
        context: Context<S, A, D>,
        config: Config<S, A, D>
    ) => void|Promise<void>;
    worker?: (
        context: Context<S, A, D>
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
    createPromMetricsAPI(
        context: Context,
        apiConfig: PromMetricsAPIConfig,
        logger: Logger,
        labels: Record<string, string>
    ): Promise<void>;
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
    [namespace: string]: any;
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

export type SysConfig<S> = {
    _nodeName: string;
    terafoundation: Foundation
} & S;

export type Foundation = {
    workers: number;
    environment: 'production'|'development'|'test'|string;
    connectors: Record<string, any>;
    log_path: string;
    log_level: LogLevelConfig;
    logging: LogType[];
    asset_storage_connection_type?: string;
    asset_storage_connection?: string;
    asset_storage_bucket?: string;
};

export type Context<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string
> = {
    sysconfig: SysConfig<S>;
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

export interface PromMetricsAPIConfig {
    assignment: string
    port: number
    default_metrics: boolean,
    labels?: Record<string, string>
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
