import {
    WorkerContext,
    SlicerContext,
    WorkerExecutionContext,
    SlicerExecutionContext
} from '@terascope/job-components';

export type ExecutionContext = WorkerExecutionContext|SlicerExecutionContext;
export type Context = SlicerContext|WorkerContext;

export interface JobHarnessOptions {
    assetDir: string;
    clients?: Client[];
}

export interface Client {
    type: string;
    client: any;
    endpoint?: string;
}

export interface Clients {
    [prop: string]: Client;
}
