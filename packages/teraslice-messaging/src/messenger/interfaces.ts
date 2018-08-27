export interface WorkerSocket extends SocketIO.Socket {
    workerId: string;
}

export interface ControllerSocket extends SocketIO.Socket {
    controllerId: string;
}

export interface NodeMasterSocket extends SocketIO.Socket {
    nodeId: string;
}

export interface MessagePayload {
    [prop: string]: any;
}

export interface Message {
    __msgId?: string;
    __source?: string;
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

export interface SliceResponseMessage {
    willProcess?: boolean;
}
