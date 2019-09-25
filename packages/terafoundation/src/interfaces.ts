import { EventEmitter } from 'events';
import { Format } from 'convict';
import { Logger } from '@terascope/utils';

export type FoundationConfig<S, A, D extends string> = {
    name: string;
    config_schema?: any;
    schema_formats?: Format[];
    default_config_file?: string;
    cluster_name?: (sysconfig: FoundationSysConfig<S>) => string;
    script?: (context: FoundationContext<S, A, D>) => void;
    descriptors?: Record<D, string>;
    worker: (context: FoundationContext<S, A, D>) => void;
    master: (context: FoundationContext<S, A, D>, config: FoundationConfig<S, A, D>) => void;
    bootstrap?: (context: FoundationContext<S, A, D>, cb: () => void) => void;
}

export interface ConnectionConfig {
    endpoint: string;
    cached?: boolean;
    type: string;
}

export interface FoundationAPIs {
    makeLogger(name: string, _meta: any): Logger;
    getSystemEvents(): EventEmitter;
    getConnection(config: ConnectionConfig): { client: any };
    startWorkers(num: number, envOptions: Record<string, string>): void;
}

export interface LegacyFoundationApis {
    makeLogger(name: string, _meta: any): Logger;
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

export type FoundationCluster = {
    isMaster?: boolean;
    worker: {
        id: string;
    };
};

export type FoundationSysConfig<S> = {
    _nodeName: string;
    terafoundation: {
        workers: number;
        environment: 'production'|'development'|'test'|string;
        connectors: Record<string, any>;
        log_path: string;
        log_level: LogLevelConfig;
        logging: LogType[];
    } & S;
}

export type FoundationContext<S = {}, A = {}, D extends string = string> = {
    sysconfig: FoundationSysConfig<S>;
    apis: ContextAPIs & A;
    foundation: LegacyFoundationApis;
    logger: Logger;
    name: string;
    arch: string;
    platform: string;
    assignment: D;
    cluster_name?: string;
    // TODO does this need to exist?
    master_plugin?: any;
    cluster: FoundationCluster;
}
