import { Slice, SliceAnalyticsData } from '@terascope/teraslice-types';

export interface ClientOptions {
    executionControllerUrl: string;
    workerId: string;
    socketOptions: SocketIOClient.ConnectOpts;
    networkLatencyBuffer?: number;
    actionTimeout: number;
}

export interface ServerOptions {
    port: number;
    controllerId: string;
    networkLatencyBuffer?: number;
    actionTimeout: number;
}

export interface Worker {
    worker_id: string;
}

export interface SliceResponseMessage {
    willProcess?: boolean;
}

export interface DispatchSliceResult {
    dispatched: boolean;
    workerId: string;
}

export interface OnWorkerOnlineFn {
    (workerId: string): void;
}

export interface OnWorkerOfflineFn {
    (workerId: string, err?: Error): void;
}

export interface OnWorkerReconnectFn {
    (workerId: string): void;
}

export interface OnWorkerReadyFn {
    (workerId: string): void;
}

export interface SliceCompletePayload {
    slice: Slice;
    analytics: SliceAnalyticsData,
    isShuttingDown?: boolean;
    retry?: boolean;
    error?: string;
}
