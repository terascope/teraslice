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
    pingTimeout: number;
    pingInterval?: number;
}

export interface Payload {
    [prop: string]: any;
}

export interface Message {
    id: string;
    from: string;
    to: string;
    eventName: string;
    payload: Payload;
}

export interface ConnectedClient {
    readonly clientId: string;
    socketId: string;
    isOnline: boolean;
    isAvailable: boolean;
    isReconnected: boolean;
    onlineAt: Date|null;
    offlineAt: Date|null;
    availableAt: Date|null;
    unavailableAt: Date|null;
    reconnectedAt: Date|null;
    metadata: object;
}

export interface ClientEventFn {
    (clientId: string, param?: any): void;
}

export interface CallbackFn {
    (err?: ResponseError, message?: Message): void;
}

export interface ResponseHandler {
    (msg: Message, callback: CallbackFn): Promise<void>;
}

export interface SendHandler {
    (err: ResponseError, response: any): void;
}

export interface MessageHandler {
    (msg: Message): Promise<Payload|void>|Payload|void;
}

export interface ErrorObj {
    message: string;
    stack?: string;
}

export type ResponseError = string|null|undefined;
