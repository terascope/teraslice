export interface ClientOptions {
    executionControllerUrl: string;
    workerId: string;
    socketOptions: SocketIOClient.ConnectOpts;
    networkLatencyBuffer?: number;
    actionTimeout: number;
    connectTimeout: number;
}

export interface ServerOptions {
    port: number;
    workerDisconnectTimeout: number;
    networkLatencyBuffer?: number;
    actionTimeout: number;
    pingInterval?: number;
    pingTimeout?: number;
}

export interface Worker {
    workerId: string;
}

export interface ActiveWorkers {
    [workerId: string]: boolean;
}

export interface SliceResponseMessage {
    willProcess?: boolean;
}
export interface WorkerShutdownFn {
    (error?: null): void;
}

export interface SliceCompletePayload {
    slice: Slice;
    analytics: SliceAnalyticsData;
    retry?: boolean;
    error?: string;
}

export interface WaitUntilFn {
    (): boolean;
}

export interface EnqueuedWorker {
    workerId: string;
}

export interface SliceRequest {
    request_worker?: string;
    [prop: string]: any;
}

export interface Slice {
    slice_id: string;
    slicer_id: number;
    slicer_order: number;
    request: SliceRequest;
    _created: string;
}

export interface SliceAnalyticsData {
    time: number[];
    size: number[];
    memory: number[];
}
