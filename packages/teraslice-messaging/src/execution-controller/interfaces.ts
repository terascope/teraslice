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
