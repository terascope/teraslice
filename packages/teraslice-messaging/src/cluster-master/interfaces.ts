import { Message } from '../messenger/interfaces';

export interface ClientOptions {
    exId: string;
    jobId: string;
    jobName: string;
    clusterMasterUrl: string;
    socketOptions: SocketIOClient.ConnectOpts;
    networkLatencyBuffer?: number;
    actionTimeout: number;
}

export interface ServerOptions {
    port: number;
    networkLatencyBuffer?: number;
    actionTimeout: number;
}

export interface SlicerAnalytics {
    processed: number;
    failed: number;
    queued: number;
    job_duration: number;
    workers_joined: number;
    workers_disconnected: number;
    workers_reconnected: number;
}

export interface ClusterAnalytics {
    slicer: SlicerAnalytics;
}

export interface ExecutionAnalyticsMessage extends Message {
    kind: string;
}

export interface ExecutionAnalytics {
    workers_available: number;
    workers_active: number;
    workers_joined: number;
    workers_reconnected: number;
    workers_disconnected: number;
    failed: number;
    subslices: number;
    queued: number;
    slice_range_expansion: number;
    processed: number;
    slicers: number;
    subslice_by_key: number;
    started: string;
}

export interface OnExecutionAnalyticsFn {
    (): Promise<ExecutionAnalytics>|ExecutionAnalytics
}

export interface OnStateChangeFn {
    (): Promise<void> | void;
}

export interface ExecutionEventFn {
    (exId: string): void;
}

export interface ExecutionErrorEventFn {
    (exId: string, err?: Error): void;
}

export interface WorkerShutdownFn {
    (error?: null): void;
}
