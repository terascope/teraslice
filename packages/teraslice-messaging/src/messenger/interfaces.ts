import 'socket.io-client';
import http from 'http';

export interface CoreOptions {
    networkLatencyBuffer?: number;
    actionTimeout: number;
}

export interface ClientOptions extends CoreOptions {
    hostUrl: string;
    clientId: string;
    clientType: string;
    serverName: string;
    socketOptions?: SocketIOClient.ConnectOpts;
}

export interface ServerOptions extends CoreOptions {
    port: number;
    serverName: string;
    clientDisconnectTimeout: number;
    serverTimeout?: number;
    pingTimeout?: number;
    pingInterval?: number;
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

export type ResponseError = ErrorObj|string;

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
}

export interface ConnectedClient {
    readonly clientId: string;
    readonly clientType: string;
    socketId: string;
    state: ClientState;
    createdAt: Date;
    updatedAt: Date;
    offlineAt: Date|null;
    metadata: object;
}

export interface UpdateClientState {
    state: ClientState;
    socketId?: string;
    metadata?: object;
    error?: Error|string;
    payload?: Payload;
}

export enum ClientState {
    Offline = 'offline',
    Online = 'online',
    Disconnected = 'disconnected',
    Available = 'available',
    Unavailable = 'unavailable',
    Shutdown = 'shutdown'
}

export interface ClientSocketMetadata {
    clientId: string;
    clientType: string;
}

export interface ConnectedClients {
    [clientId: string]: ConnectedClient;
}

export interface ClientSendFns {
    [clientId: string]: (eventName: string, payload?: Payload, options?: SendOptions) => Promise<Message|null>;
}

export interface ClientEventFn {
    (clientId: string, param?: any): void;
}

export interface MessageHandler {
    (msg: Message): Promise<Payload|void>|Payload|void;
}
