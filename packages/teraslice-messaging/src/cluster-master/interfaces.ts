import { Message } from '../messenger/interfaces';

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
