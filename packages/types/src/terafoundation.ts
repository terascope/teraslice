import type { EventEmitter } from 'node:events';
import {
    Cluster as NodeJSCluster,
    Worker as NodeJSWorker
} from 'node:cluster';
import {
    CollectFunction, Counter, Gauge,
    Histogram, Summary
} from 'prom-client';
import type { Overwrite } from './utility.js';
import type { Logger } from './logger.js';

interface Format {
    name?: string | undefined;
    validate?(val: any, schema: SchemaObj): void;
    coerce?(val: any): any;
}

export interface SchemaObj<T = any> {
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

export type Initializers<S = Record<string, any>> = {
    schema: Schema<S>;
    validatorFn?: ValidatorFn<S>;
};

export type ValidationObj<S> = {
    config: Record<string, any>;
    validatorFn?: ValidatorFn<S>;
    connector?: boolean;
};

export type ValidatorFn<S = Record<string, any>> = (
    config: Record<string, any>,
    sysconfig: SysConfig<S>
) => void;

export type Config<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string
> = {
    name: string;
    config_schema?: any;
    schema_formats?: Format[];
    default_config_file?: string;
    cluster_name?: string | ((sysconfig: SysConfig<S>) => string);
    script?: (context: Context<S, A, D>) => void | Promise<void>;
    descriptors?: Record<D, string>;
    master?: (
        context: Context<S, A, D>,
        config: Config<S, A, D>
    ) => void | Promise<void>;
    worker?: (
        context: Context<S, A, D>
    ) => void | Promise<void>;
    start_workers?: boolean;
    shutdownMessaging?: boolean;
};

export interface ConnectionConfig {
    endpoint: string;
    cached?: boolean;
    type: string;
}

export interface ConnectorOutput {
    client: any;
    logger: Logger;
}

export type CreateClientFactoryFn = (
    config: Record<string, any>,
    logger: Logger,
    options: ConnectionConfig
) => Promise<ConnectorOutput>;

export interface FoundationAPIs {
    /** Create a child logger */
    makeLogger(metadata?: Record<string, string>): Logger;
    /** Create the root logger (usually done automatically) */
    makeLogger(name: string, filename: string): Logger;
    getSystemEvents(): EventEmitter;
    createClient(config: ConnectionConfig): Promise<ConnectorOutput>;
    startWorkers(num: number, envOptions: Record<string, any>): FoundationWorker[];
    promMetrics: PromMetrics;
}

export type ContextAPIs = {
    readonly foundation: FoundationAPIs;
    registerAPI(namespace: string, apis: any): void;
    [namespace: string]: any;
};

export type LogType = 'console' | 'file';
export type LogLevelType = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogLevelConfig = string|({
    [type in LogType]: LogLevelType;
}[]);

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

export interface TerafoundationConfig {
    workers: number;
    connectors: Record<string, Record<string, any>>;
    log_path: string;
    log_level: LogLevelConfig;
    logging: LogType[];
    prom_metrics_enabled: boolean;
    prom_metrics_port: number;
    prom_metrics_add_default: boolean;
    prom_metrics_display_url: string;
}

export type SysConfig<S> = {
    _nodeName: string;
    terafoundation: TerafoundationConfig;
} & S;

export type Context<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string
> = {
    sysconfig: SysConfig<S>;
    apis: ContextAPIs & A;
    logger: Logger;
    name: string;
    arch: string;
    platform: string;
    assignment: D;
    cluster_name?: string;
    cluster: Cluster;
};

// the interface for the connector itself
export interface Connector<S = Record<string, any>> {
    createClient: (
        moduleConfig: Record<string, any>, logger: Logger, options: Record<string, any>
    ) => Promise<ConnectorOutput>;
    config_schema: () => Schema<S>;
    validate_config?: ValidatorFn<S>;
}

export interface PromMetricsInitConfig {
    terasliceName: string;
    assignment: string;
    logger: Logger;
    tf_prom_metrics_enabled: boolean;
    tf_prom_metrics_port: number;
    tf_prom_metrics_add_default: boolean;
    job_prom_metrics_enabled?: boolean;
    job_prom_metrics_port?: number;
    job_prom_metrics_add_default?: boolean;
    labels?: Record<string, string>;
    prefix?: string;
    prom_metrics_display_url: string;
}

export interface PromMetricsAPIConfig {
    assignment: string;
    port: number;
    default_metrics: boolean;
    labels?: Record<string, string>;
    prefix?: string;
}

export interface PromMetrics {
    init: (config: PromMetricsInitConfig) => Promise<boolean>;
    set: (name: string, labels: Record<string, string>, value: number) => void;
    inc: (name: string, labelValues: Record<string, string>, value: number) => void;
    dec: (name: string, labelValues: Record<string, string>, value: number) => void;
    observe: (name: string, labelValues: Record<string, string>, value: number) => void;
    addGauge: (name: string, help: string, labelNames: Array<string>,
        collectFn?: CollectFunction<Gauge>) => Promise<void>;
    addCounter: (name: string, help: string, labelNames: Array<string>,
        collectFn?: CollectFunction<Counter>) => Promise<void>;
    addHistogram: (name: string, help: string, labelNames: Array<string>,
        collectFn?: CollectFunction<Histogram>, buckets?: Array<number>) => Promise<void>;
    addSummary: (name: string, help: string, labelNames: Array<string>,
        collectFn?: CollectFunction<Summary>, maxAgeSeconds?: number,
        ageBuckets?: number, percentiles?: Array<number>) => Promise<void>;
    hasMetric: (name: string) => boolean;
    deleteMetric: (name: string) => Promise<boolean>;
    verifyAPI: () => boolean;
    resetMetrics: () => void;
    shutdown: () => Promise<void>;
    getDefaultLabels: () => Record<string, string>;
}

export type MetricList = Record<string, {
    readonly name?: string;
    readonly metric?: Gauge<any> | Counter<any> | Histogram<any> | Summary<any>;
    readonly functions?: Set<string>;
}>;

export type {
    CollectFunction, Counter, Gauge, Histogram, Summary
} from 'prom-client';
