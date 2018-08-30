export interface CoreOptions {
    networkLatencyBuffer?: number;
    actionTimeout: number;
    source: string;
    to: string;
}

export interface ClientOptions extends CoreOptions {
    hostUrl: string;
    clientId: string;
    socketOptions?: SocketIOClient.ConnectOpts;
}

export interface ServerOptions extends CoreOptions {
    port: number;
    pingTimeout: number;
}

export interface MessagePayload {
    [prop: string]: any;
}

export interface Message {
    __msgId: string;
    __source: string;
    to: string;
    address?: string;
    message: string;
    payload?: MessagePayload;
    response?: boolean;
    error?: string;
    [prop: string]: any;
}

export interface InputMessage {
    to?: string;
    address?: string;
    message: string;
    payload?: MessagePayload;
    error?: string;
    [prop: string]: any;
}

export interface MessageResponse {
    timeoutMs?: number;
    retry?: boolean;
}

export interface SendWithResponseOptions {
    timeoutMs?: number;
    retry?: boolean;
}

export interface ClientEventFn {
    (clientId: string, param?: any): void;
}
