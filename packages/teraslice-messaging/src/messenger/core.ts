import { toString, isSafeInteger } from 'lodash';
import debugFn from 'debug';
import { EventEmitter } from 'events';
import * as i from './interfaces';

const debug = debugFn('teraslice-messaging:core');

export class Core extends EventEmitter {
    public closed: boolean = false;

    protected networkLatencyBuffer: number;
    protected actionTimeout: number;

    constructor(opts: i.CoreOptions) {
        super();

        this.networkLatencyBuffer = opts.networkLatencyBuffer || 0;
        this.actionTimeout = opts.actionTimeout;

        if (!isSafeInteger(this.actionTimeout) || !this.actionTimeout) {
            throw new Error('Messenger requires a valid actionTimeout');
        }

        if (!isSafeInteger(this.networkLatencyBuffer)) {
            throw new Error('Messenger requires a valid networkLatencyBuffer');
        }
    }

    close() {
        this.closed = true;
        this.removeAllListeners();
    }

    protected async handleSendResponse(sent: i.Message): Promise<i.Message|null> {
        if (!sent.response) return null;
        debug('waiting for response from message', sent);

        const remaining = sent.respondBy - Date.now();
        const timeoutError = new Error(`Timed out after ${remaining}ms, waiting for message "${sent.eventName}"`);

        const responseError = new Error(`${sent.eventName} Message Response Failure`);
        const response = await this.onceWithTimeout(sent.id, remaining);

        // it is a timeout
        if (response == null) {
            if (sent.volatile || this.closed) {
                return null;
            }
            throw timeoutError;
        }

        if (response.error) {
            responseError.message += `: ${response.error}`;
                // @ts-ignore
            responseError.response = response;
            debug('message send response error', responseError);
            throw responseError;
        }

        return response;
    }

    protected handleResponse(socket: i.SocketEmitter, eventName: string, fn: i.MessageHandler) {
        debug(`registering response handler for ${eventName}`);

        socket.on(eventName, async (msg: i.Message) => {
            const message: i.Message = Object.assign({}, msg, {
                from: msg.to,
                to: msg.from,
                payload: {},
            });

            try {
                const payload = await fn(msg);
                if (payload) {
                    message.payload = payload;
                }
            } catch (err) {
                message.error = toString(err);
            }

            if (!msg.response) {
                return;
            }

            if (!msg.volatile && !this.isClientReady(message.to)) {
                const remaining = msg.respondBy - Date.now();
                await this.waitForClientReady(message.to, remaining);
            }

            debug(`responding to ${eventName} with message`, message);
            // @ts-ignore
            socket.emit('message:response', message);
        });
    }

    isClientReady(clientId?: string): boolean {
        debug('isClientReady should be implemented on the server and client class', clientId);
        throw new Error('isClientReady should be implemented on the server and client class');
    }

    async waitForClientReady(clientId: string, timeout?: number): Promise<boolean> {
        if (this.isClientReady(clientId)) {
            return true;
        }

        debug(`waiting for ${clientId} to be ready`);
        await this.onceWithTimeout(`ready:${clientId}`, timeout);
        const isReady = this.isClientReady(clientId);
        if (!isReady) {
            throw new Error(`Client ${clientId} is not ready`);
        }
        return isReady;
    }

    getTimeoutWithMax(maxTimeout: number): number {
        const timeout = this.getTimeout();
        return timeout > maxTimeout ? maxTimeout : timeout;
    }

    getTimeout(timeout?: number): number {
        return (timeout || this.actionTimeout) + this.networkLatencyBuffer;
    }

    // @ts-ignore
    on(eventName: string, listener: i.EventListener) {
        super.on(eventName, listener);
    }

    // @ts-ignore
    emit(eventName: string, msg: i.EventMessage) {
        super.emit(`${eventName}`, msg);
        if (msg.scope) {
            super.emit(`${eventName}:${msg.scope}`, msg);
        }
    }

    async onceWithTimeout(eventName: string, timeout?: number): Promise<any> {
        const timeoutMs: number = this.getTimeout(timeout);

        const result = await new Promise((resolve) => {
            const finish = (result?: any) => {
                this.removeListener(eventName, onMessage);

                if (timer != null) clearTimeout(timer);

                resolve(result);
            };

            const onMessage = (msg: i.EventMessage) => {
                finish(msg.payload);
            };

            this.on(eventName, onMessage);
            const timer = setTimeout(finish, timeoutMs);
        });

        return result;
    }
}
