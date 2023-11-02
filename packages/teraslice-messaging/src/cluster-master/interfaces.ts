import { Logger } from '@terascope/utils';
import { ExecutionAnalytics, AggregatedExecutionAnalytics } from '@terascope/types';
import { Message, RequestListener } from '../messenger/interfaces';

export interface ClientOptions {
    exId: string;
    clusterMasterUrl: string;
    nodeDisconnectTimeout: number;
    socketOptions?: SocketIOClient.ConnectOpts;
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

export interface ClusterAnalytics {
    controllers: AggregatedExecutionAnalytics;
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
