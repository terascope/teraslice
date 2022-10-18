import { Logger } from '@terascope/utils';
import { Message, RequestListener } from '../messenger/interfaces.js';

export interface ClientOptions {
    exId: string;
    clusterMasterUrl: string;
    nodeDisconnectTimeout: number;
    socketOptions: SocketIOClient.ConnectOpts;
    networkLatencyBuffer?: number;
    actionTimeout: number;
    connectTimeout: number;
    logger?: Logger;
}

export interface ServerOptions {
    port: number;
    nodeDisconnectTimeout: number;
    actionTimeout: number;
    serverTimeout?: number;
    networkLatencyBuffer?: number;
    requestListener?: RequestListener;
    logger?: Logger;
}

export interface ClusterExecutionAnalytics {
    processed: number;
    failed: number;
    queued: number;
    job_duration: number;
    workers_joined: number;
    workers_disconnected: number;
    workers_reconnected: number;
}

export interface ClusterAnalytics {
    controllers: ClusterExecutionAnalytics;
}

export interface ExecutionAnalytics {
    workers_available: number;
    workers_active: number;
    workers_joined: number;
    workers_reconnected: number;
    workers_disconnected: number;
    job_duration: number;
    failed: number;
    subslices: number;
    queued: number;
    slice_range_expansion: number;
    processed: number;
    slicers: number;
    subslice_by_key: number;
    started: string;
}

export interface ExecutionAnalyticsMessage extends Message {
    kind: string;
    stats: ExecutionAnalytics;
}

export interface OnExecutionAnalyticsFn {
    (): Promise<ExecutionAnalytics> | ExecutionAnalytics;
}

export interface OnStateChangeFn {
    (): Promise<void> | void;
}

export interface WorkerShutdownFn {
    (error?: null): void;
}
