import { Message } from '../messenger/interfaces';

export interface ClientOptions {
    clusterMasterUrl: string;
    controllerId: string;
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

export interface ClusterAnalyticsMessage extends Message {
    kind: string;
}
