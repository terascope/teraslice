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

export interface ConnectorOutput {
    client: any;
    logger: Logger
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
    startWorkers(num: number, envOptions: Record<string, any>): void;
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

export interface TerafoundationConfig {
    workers: number;
    environment: 'production'|'development'|'test'|string;
    connectors: Record<string, Record<string, any>>;
    log_path: string;
    log_level: LogLevelConfig;
    logging: LogType[];
    asset_storage_connection_type?: string;
    asset_storage_connection?: string;
    asset_storage_bucket?: string;
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
}

// the interface for the connector itself
export interface Connector {
    createClient: (
        moduleConfig: Record<string, any>, logger: Logger, options: Record<string, any>
    ) => Promise<ConnectorOutput>
    config_schema: () => Record<string, any>
}
