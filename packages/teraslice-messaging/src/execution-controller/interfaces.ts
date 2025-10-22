import { Logger } from '@terascope/core-utils';
import http from 'node:http';

export interface ClientOptions {
    executionControllerUrl: string;
    workerId: string;
    socketOptions: SocketIOClient.ConnectOpts;
    workerDisconnectTimeout: number;
    networkLatencyBuffer?: number;
    actionTimeout: number;
    connectTimeout: number;
    logger?: Logger;
}

export interface ServerOptions {
    port: number;
    workerDisconnectTimeout: number;
    networkLatencyBuffer?: number;
    actionTimeout: number;
    requestListener?: RequestListener;
    logger?: Logger;
}

export interface RequestListener {
    (request: http.IncomingMessage, response: http.ServerResponse): void;
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

export interface WaitUntilFn {
    (): boolean;
}
