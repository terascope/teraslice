import { ManagerOptions, SocketOptions } from 'socket.io-client';
import http from 'node:http';
import { Logger } from '@terascope/core-utils';

export interface CoreOptions {
    networkLatencyBuffer?: number;
    actionTimeout: number;
    logger?: Logger;
}

export interface ClientOptions extends CoreOptions {
    hostUrl: string;
    clientId: string;
    clientType: string;
    serverName: string;
    clientDisconnectTimeout: number;
    connectTimeout: number;
    socketOptions?: Partial<ManagerOptions & SocketOptions>;
}

export interface ServerOptions extends CoreOptions {
    port: number;
    serverName: string;
    clientDisconnectTimeout: number;
    serverTimeout?: number;
    requestListener?: RequestListener;
}

export interface RequestListener {
    (request: http.IncomingMessage, response: http.ServerResponse): void;
}

export interface Payload {
    [prop: string]: any;
}

export interface ErrorObj {
    message: string;
    stack?: string;
}

export type ResponseError = ErrorObj | string;

export interface Message {
    id: string;
    from: string;
    to: string;
    eventName: string;
    payload: Payload;
    respondBy: number;
    response?: boolean;
    volatile?: boolean;
    error?: ResponseError;
}

export interface SendOptions {
    volatile?: boolean;
    response?: boolean;
    timeout?: number;
    sendAbortSignal?: boolean;
}

export interface ConnectedClient {
    readonly clientId: string;
    state: ClientState;
}

export interface UpdateClientState {
    state: ClientState;
    error?: Error | string;
    payload?: Payload;
}

export enum ClientState {
    Online = 'online',
    Disconnected = 'disconnected',
    Available = 'available',
    Unavailable = 'unavailable',
    Shutdown = 'shutdown',
}

export interface ClientSocketMetadata {
    clientId: string;
    clientType: string;
}

export interface ConnectedClients {
    [clientId: string]: ConnectedClient;
}

export interface ClientSendFn {
    (message: Message): void;
}

export interface ClientSendFns {
    [clientId: string]: ClientSendFn | null;
}

export interface MessageHandler {
    (msg: Message): Promise<Payload | void> | Payload | void;
}

export interface EventMessage {
    scope: string;
    payload: any;
    error?: Error | ResponseError;
}

export interface ClientEventMessage {
    scope?: string;
    payload: any;
    error?: Error | ResponseError;
}

export interface EventListener {
    (msg: EventMessage): void;
}

export interface SocketEmitter {
    on(eventName: string, fn: (msg: Message) => void): void;
    emit(eventName: string, msg: Message): void;
}

export interface ClientToServerEvents {
    'message:response': (msg: Message) => void;
    [eventName: string]: (message: Message) => void;
}

export interface ServerToClientEvents {
    'message:response': (msg: Message) => void;
    shutdown: () => void;
    [eventName: string]: (message: Message) => void;
}
