import {
    WorkerContext,
    SlicerContext,
    WorkerExecutionContext,
    SlicerExecutionContext,
    ConnectionConfig,
    Logger
} from '@terascope/job-components';

export type ExecutionContext = WorkerExecutionContext|SlicerExecutionContext;
export type Context = SlicerContext|WorkerContext;

export interface JobHarnessOptions {
    assetDir?: string;
    clients?: Client[];
}

export interface Client {
    type: string;
    create: ClientFactoryFn;
    config?: object;
    endpoint?: string;
}

export type ClientFactoryFn = (config: object, logger: Logger, options: ConnectionConfig) => any;

export interface ClientFactoryFns {
    [prop: string]: ClientFactoryFn;
}

export interface CachedClients {
    [prop: string]: any;
}
