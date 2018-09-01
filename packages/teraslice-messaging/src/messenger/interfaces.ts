import 'socket.io-client';

export interface CoreOptions {
    networkLatencyBuffer?: number;
    actionTimeout: number;
}

export interface ClientOptions extends CoreOptions {
    hostUrl: string;
    clientId: string;
    serverName: string;
    socketOptions?: SocketIOClient.ConnectOpts;
}

export interface ServerOptions extends CoreOptions {
    port: number;
    serverName: string;
    clientDisconnectTimeout: number;
    pingTimeout?: number;
    pingInterval?: number;
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
    volatile?: boolean;
    error?: ResponseError;
}

export interface ConnectedClient {
    readonly clientId: string;
    socketId: string;
    isOnline: boolean;
    isAvailable: boolean;
    isReconnected?: boolean;
    isNewConnection?: boolean;
    onlineAt: Date|null;
    offlineAt: Date|null;
    availableAt: Date|null;
    unavailableAt: Date|null;
    metadata: object;
}

export interface ConnectedClients {
    [clientId: string]: ConnectedClient;
}

export interface ClientEventFn {
    (clientId: string, param?: any): void;
}

export interface MessageHandler {
    (msg: Message): Promise<Payload|void>|Payload|void;
}
